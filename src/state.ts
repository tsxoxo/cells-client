import { assertEvent } from 'xstate';
import type { Cell } from './types';
import { Context, changeCellContent } from './cellsMachine';
import { parseToAST } from './parse/main';
import { AppError, ParseError, Result, fail, isSuccess, success } from './parse/types/errors';
import { interpret } from './parse/interpret';

// CONTROL FLOW
export function handleCellContentChange(context: Context, event: changeCellContent): Result<Cell[], AppError> {
  assertEvent(event, 'changeCellContent');
  //console.log(`event.value: ${event.value}`)
  //console.log(`event.indexOfCell: ${event.indexOfCell}`)

  const updatedCells = structuredClone(context.cells)
  const oldCell = structuredClone(updatedCells[event.indexOfCell])

  // Evaluate content. Parse if formula.
  const maybeNewCell = updateCellContent(oldCell, event.value, context.cells)

  // Enrich ParseError with index of cell
  if(!isSuccess(maybeNewCell)) {
    return fail({
        indexOfCell: event.indexOfCell,
        cause: maybeNewCell.error
    })
  }

  // Happy path: not formula or successfully parsed.
  //
  // Update dependencies.
  const { dependencies: oldDeps } = oldCell
  const { dependencies: newDeps } = maybeNewCell.value
  const { stale, fresh } = makeDiff( oldDeps, newDeps )
  const cellsWithUpdatedDeps = updateDeps( updatedCells, event.indexOfCell, stale, fresh)

  // cells = propagateChanges(cells, event.indexOfCell)

  return success(cellsWithUpdatedDeps.toSpliced(event.indexOfCell, 1, maybeNewCell.value))
}

// UTILS

// Update a single cell
// cells are needed for resolution when interpreting a formula like "1+A0"
function updateCellContent(cell: Cell, newContent: string, cells: Cell[]): Result<Cell, ParseError> {
  const updatedCell = structuredClone(cell)
  updatedCell.content = newContent

  // If it looks like a formula, try parsing it.
  if( newContent[0] === '=' ) {
    // Could this be cleaner?
    //const result = isSuccess(astResult)
    //  ? interpret(astResult.value, cells)
    //  : astResult // early fail
    const maybeAST = parseToAST(newContent.slice(1))
    //console.log(`AFTER PARSE: ${JSON.stringify(parseResult)}`)

    if( !isSuccess(maybeAST) ) {
      return maybeAST
    }

    // Happy path: formula has been successfully parsed.
    //
    const maybeFormulaResult = interpret( maybeAST.value, cells )
    if( !isSuccess(maybeFormulaResult) ) {
      return maybeFormulaResult
    }

    // Update cell with result of calculation and new dependencies
    updatedCell.value = maybeFormulaResult.value.formulaResult
    updatedCell.dependencies = maybeFormulaResult.value.deps
  } else {
    // Not a formula. Clear dependencies.
    updatedCell.dependencies = []
  }

  // It's not a formula or parsing was success.
  return success( updatedCell )
}

// Return a list of dependencies to update.
function makeDiff( oldDeps: number[], newDeps: number[] ): { stale: number[], fresh: number[] } {
    const stale: number[] = oldDeps.filter(index => !newDeps.includes(index))
    const fresh: number[] = newDeps.filter(index => !oldDeps.includes(index))

  return ( { stale, fresh } )
}

// Update cell array with changed dependencies.
// stale = cells that lost `changedCell` as a dependent
// fresh = cells that gained `changedCell` as a dependent
function updateDeps( cells: Cell[], indexOfChangedCell: number, stale: number[], fresh: number[] ) {
  const updatedCells = structuredClone( cells )

  stale.forEach((index) => {
    const cellThatLostDep = updatedCells[index]
    const indexOfElementToRemove = cellThatLostDep.dependents.indexOf(indexOfChangedCell)

    if (indexOfElementToRemove === -1) {
      return
    }

    cellThatLostDep.dependents.splice(indexOfElementToRemove, 1)
  })

  fresh.forEach((index) => {
    const cellThatGainedDep = updatedCells[index]
    const indexOfElementToAdd = cellThatGainedDep.dependents.indexOf(indexOfChangedCell)

    if (indexOfElementToAdd !== -1) {
      return
    }

    cellThatGainedDep.dependents.push(indexOfChangedCell)
  })

  return updatedCells
}


export function withPropagatedChanges(cells: Cell[], indexOfChangedCell: number): { errors: AppError[] | [], cellsAfterPropagation: Cell[] } {
    let cellsAfterPropagation = structuredClone(cells)
    let errors: AppError[] | [] = [];

    function propagate(fromThisIndex: number) {
        cellsAfterPropagation[fromThisIndex].dependents.forEach((indexOfCellToRecalculate) => {
            const cellToUpdate = cellsAfterPropagation[indexOfCellToRecalculate]
            const { errorMessage, cleanTokens, value } = parseInput(cellToUpdate.content, cellsAfterPropagation)
            cellToUpdate.value = value
            cellToUpdate.dependencies = cleanTokens
            if (errorMessage !== '') {
                console.log(`errorMessage: ${errorMessage}`);

                errors = [...errors, {
                    indexOfCell: indexOfCellToRecalculate,
                    message: errorMessage
                }]
            }
            propagate(indexOfCellToRecalculate)
        })
    }

    propagate(indexOfChangedCell)

    return { errors, cellsAfterPropagation }
}

