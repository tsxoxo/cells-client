import { assertEvent } from 'xstate';
import type { AppError, Cell } from './types';
import { Context, changeCellContent } from './cellsMachine';
import { parseFormula } from './parse/main';
import { Result, fail, isSuccess, success } from './parse/types/errors';


// CONTROL FLOW
export function handleCellContentChange(context: Context, event: changeCellContent): Result<Cell[]> {
  assertEvent(event, 'changeCellContent');
  //console.log(`event.value: ${event.value}`)
  //console.log(`event.indexOfCell: ${event.indexOfCell}`)

  const updatedCells = structuredClone(context.cells)
  const oldCell = structuredClone(updatedCells[event.indexOfCell])

  // Evaluate content. Parse if formula.
  const maybeNewCell = updateCellContent(oldCell, event.value)
  if(!isSuccess(maybeNewCell)) {
    return maybeNewCell
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
function updateCellContent(cell:Cell, newContent: string): Result<Cell> {
  const updatedCell = structuredClone(cell)
  updatedCell.content = newContent

  // If it looks like a formula, try parsing it.
  if( newContent[0] === '=' ) {
    const parseResult = parseFormula(newContent.slice(1))
    //console.log(`AFTER PARSE: ${JSON.stringify(parseResult)}`)

    if( !isSuccess(parseResult) ) {
      return parseResult
    }

    // Happy path: formula has been successfully parsed.
    // Update cell with result of calculation and new dependencies
    updatedCell.value = parseResult.value.formulaResult
    updatedCell.dependencies = parseResult.value.deps
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

