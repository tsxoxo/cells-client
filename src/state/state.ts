import { assertEvent } from "xstate"
import type { Cell } from "../types/types"
import { Context, ChangeCell } from "./cellsMachine"
import { parseToAST } from "../parse/main"
import { Result, fail, isSuccess, success } from "../parse/types/result"
import { AppError } from "../errors/errors"
import { interpret } from "../parse/interpret"
import { isNumber } from "../parse/utils/match"
import { createCellValueProvider } from "../parse/utils/cells"
import { NUM_OF_COLS } from "../config/constants"
import { ParseError } from "../parse/types/errors"

// CONTROL FLOW
export function handleCellContentChange(
    context: Context,
    event: ChangeCell,
): Result<{ cells: Cell[] }, AppError> {
    assertEvent(event, "changeCell")

    // Evaluate content. Parse if formula.
    const maybeNewCell = updateCell(event.cellIndex, event.value, context.cells)

    // Enrich ParseError with index of cell
    if (!isSuccess(maybeNewCell)) {
        return fail({
            cellIndex: event.cellIndex,
            cause: maybeNewCell.error,
        })
    }

    // HACK: for now, just return the new cell
    return success({ cells: [maybeNewCell.value] })

    // Happy path: not formula or successfully parsed.
    //
    // Update dependencies.
    const { dependencies: oldDeps } = context.cells[event.cellIndex]
    const { dependencies: newDeps } = maybeNewCell.value
    const { stale, fresh } = makeDiff(oldDeps, newDeps)
    const cellsWithUpdatedDeps = updateDeps(
        context.cells,
        event.cellIndex,
        stale,
        fresh,
    )

    // TODO: propagation
    // cells = propagateChanges(cells, event.indexOfCell)

    return success(
        cellsWithUpdatedDeps.toSpliced(event.cellIndex, 1, maybeNewCell.value),
    )
}

// UTILS

// Update a single cell
// cells are needed for resolution when interpreting a formula like "1+A0"
function updateCell(
    cellIndex: number,
    newContent: string,
    cells: Cell[],
): Result<Cell, ParseError> {
    const updatedCell = structuredClone(cells[cellIndex])
    updatedCell.content = newContent

    // Empty formula. Don't parse.
    if (newContent === "=") {
        updatedCell.value = undefined
        updatedCell.dependencies = []

        return success(updatedCell)
    }

    // Looks like formula. Try parsing it.
    if (newContent[0] === "=") {
        const maybeEvalResult = safeEval(newContent.slice(1), cells, cellIndex)

        if (!isSuccess(maybeEvalResult)) {
            return maybeEvalResult
        }

        // Happy path: formula has been successfully parsed.
        // Update cell with result of calculation and new dependencies
        updatedCell.value = maybeEvalResult.value.res
        updatedCell.dependencies = maybeEvalResult.value.deps

        return success(updatedCell)
    }

    // Single number. Still usable as value
    if (isNumber(newContent)) {
        updatedCell.value = parseFloat(newContent)
        updatedCell.dependencies = []

        return success(updatedCell)
    }

    // Default: treat as string
    updatedCell.value = undefined
    updatedCell.dependencies = []

    return success(updatedCell)
}

// Wraps parsing in try catch
function safeEval(
    formula: string,
    cells: Cell[],
    cellIndex: number,
): Result<{ res: number; deps: number[] }, ParseError> {
    const maybeAST = parseToAST(formula)
    if (!isSuccess(maybeAST)) {
        return maybeAST
    }

    const cellValueProvider = createCellValueProvider(cells, NUM_OF_COLS)
    const maybeFormula = interpret(maybeAST.value, cellValueProvider, cellIndex)

    // Pass along either error or result
    // If this crashes, let it crash.
    // I had a try..catch block here before. I removed it -- we catch programming errors in a different way.
    return maybeFormula
}

// Make diff of to numeric arrays
// used to make a list of stale/fresh dependencies to update.
function makeDiff(
    oldDeps: number[],
    newDeps: number[],
): { stale: number[]; fresh: number[] } {
    const stale: number[] = oldDeps.filter((index) => !newDeps.includes(index))
    const fresh: number[] = newDeps.filter((index) => !oldDeps.includes(index))

    return { stale, fresh }
}

// Update cell array with changed dependencies.
// stale = cells that lost `changed` cell as a dependent
// fresh = cells that gained `changed` cell as a dependent
function updateDeps(
    cells: Cell[],
    changed: number,
    stale: number[],
    fresh: number[],
) {
    const updatedCells = structuredClone(cells)

    stale.forEach((index) => {
        const cellThatLostDep = updatedCells[index]
        const indexOfElementToRemove =
            cellThatLostDep.dependents.indexOf(changed)

        if (indexOfElementToRemove === -1) {
            return
        }

        cellThatLostDep.dependents.splice(indexOfElementToRemove, 1)
    })

    fresh.forEach((index) => {
        const cellThatGainedDep = updatedCells[index]
        const indexOfElementToAdd =
            cellThatGainedDep.dependents.indexOf(changed)

        if (indexOfElementToAdd !== -1) {
            return
        }

        cellThatGainedDep.dependents.push(changed)
    })

    return updatedCells
}

//export function withPropagatedChanges(
//  cells: Cell[],
//  indexOfChangedCell: number,
//): { errors: AppError[] | []; cellsAfterPropagation: Cell[] } {
//  const cellsAfterPropagation = structuredClone(cells)
//  let errors: AppError[] | [] = []
//
//  function propagate(fromThisIndex: number) {
//    cellsAfterPropagation[fromThisIndex].dependents.forEach(
//      (indexOfCellToRecalculate) => {
//        const cellToUpdate = cellsAfterPropagation[indexOfCellToRecalculate]
//        const { errorMessage, cleanTokens, value } = parseInput(
//          cellToUpdate.content,
//          cellsAfterPropagation,
//        )
//        cellToUpdate.value = value
//        cellToUpdate.dependencies = cleanTokens
//        if (errorMessage !== "") {
//          console.log(`errorMessage: ${errorMessage}`)
//
//          errors = [
//            ...errors,
//            {
//              indexOfCell: indexOfCellToRecalculate,
//              message: errorMessage,
//            },
//          ]
//        }
//        propagate(indexOfCellToRecalculate)
//      },
//    )
//  }
//
//  propagate(indexOfChangedCell)
//
//  return { errors, cellsAfterPropagation }
//}
