import { assertEvent } from 'xstate';
import type { AppError, Cell } from './types';
import { Context, changeCellContent } from './cellsMachine';
import { ALPHABET_WITH_FILLER, NUM_OF_ROWS } from "./constants"
import { parseFormula } from './parse/main';
import { Result, fail, isSuccess, success } from './parse/types/errors';

// UTILS
function getIndexFromCellName(cellName: string) {
    // cellName examples: 'A1', 'B99'
    // We call the letter x and the number y such as 'A0' === (1, 1)
    const x = ALPHABET_WITH_FILLER.indexOf(cellName[0])
    const y = Number(cellName.slice(1)) + 1

    return NUM_OF_ROWS * (x - 1) + y - 1
}

// CONTROL FLOW
export function handleCellContentChange(context: Context, event: changeCellContent): Result<Cell[]> {
  assertEvent(event, 'changeCellContent');
  //console.log(`event.value: ${event.value}`)
  //console.log(`event.indexOfCell: ${event.indexOfCell}`)

  const updatedCells = structuredClone(context.cells)
  const oldCell = structuredClone(updatedCells[event.indexOfCell])
  const result = updateCellContent(oldCell, event.value)

  if(!isSuccess(result)) {
    return result
  }

  // TODO: Update other cells based on changed dependencies...
  // determine which dependencies to update
  // makeDiff( oldDeps, newDeps ): { stale, new }
  // cells = updateDeps( stale new )
  //
  // cells = propagateChanges(cells, event.indexOfCell)

  return success(updatedCells.toSpliced(event.indexOfCell, 1, result.value))
}

// Update a single cell
function updateCellContent(cell:Cell, newContent: string): Result<Cell> {
  //console.log(`updateCellContent with ${JSON.stringify( cell )} and ${newContent}`)
  // Create dummy cell to be updated
  const updatedCell = structuredClone(cell)
  updatedCell.content = newContent

  // If it looks like a formula, try parsing it.
  if( newContent[0] === '=' ) {
    const parseResult:  Result<{
    calcResult: number;
    deps: number[];
}>
 = parseFormula(newContent.slice(1))

    if( !isSuccess(parseResult) ) {
      return parseResult
    }

    // Happy path: formula has been successfully parsed.
    // Update cell with result of calculation and new dependencies
    updatedCell.value = parseResult.value.calcResult
    updatedCell.dependencies = parseResult.value.deps
  } 

  //console.log(`returning cell: ${JSON.stringify(updatedCell)}`)
  // It's not a formula or parsing was success.
  return success( updatedCell )
  }

  function updateDeps(oldCell: Cell, newCell: Cell) {
    const cellsWithUpdatedCell = context.cells.toSpliced(event.indexOfCell, 1, updatedCell)
    const cellsWithUpdatedCellAndDependencies = withUpdatedCellDependencies(
      cellsWithUpdatedCell,
      context.cells[event.indexOfCell]?.dependencies || [],
      event.indexOfCell
    )

  const { errors: propagationErrors, cellsAfterPropagation } = withPropagatedChanges(cellsWithUpdatedCellAndDependencies, event.indexOfCell);

  if (inputErrorMessage !== '') {
    errors = [...errors, {
      indexOfCell: event.indexOfCell,
      message: inputErrorMessage
    }];
  }
  errors = [...errors, ...propagationErrors];

  return {
    cells: cellsAfterPropagation,
    errors
  };
}

export function withUpdatedCellDependencies(cells: Cell[], oldTokens: CleanToken[] | [], indexOfChangedCell: number): Cell[] {
    const newTokens = cells[indexOfChangedCell].dependencies
    const updatedCells = structuredClone(cells)
    const newCellsReferences: number[] | [] = newTokens.filter((token: CleanToken) => token.indexOfOriginCell > -1).map(token => token.indexOfOriginCell)
    const oldCellsReferences: number[] | [] = oldTokens.filter((token: CleanToken) => token.indexOfOriginCell > -1).map(token => token.indexOfOriginCell)
    const cellsThatLostDep: number[] | [] = oldCellsReferences.filter(index => !newCellsReferences.includes(index))
    const cellsThatGainedDep: number[] | [] = newCellsReferences.filter(index => !oldCellsReferences.includes(index))

    cellsThatLostDep.forEach((index) => {
        const cellToUpdate = updatedCells[index]
        const indexOfElementToRemove = cellToUpdate.dependents.indexOf(indexOfChangedCell)

        if (indexOfElementToRemove === -1) {
            return
        }

        cellToUpdate.dependents.splice(indexOfElementToRemove, 1)
    })

    cellsThatGainedDep.forEach((index) => {
        const cellToUpdate = updatedCells[index]

        // Check for duplicates. TODO: mb make this a Set
        const indexOfElementToAdd = cellToUpdate.dependents.indexOf(indexOfChangedCell)
        if (indexOfElementToAdd !== -1) {
            return
        }

        cellToUpdate.dependents.push(indexOfChangedCell)
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

