import { ALPHABET_WITH_FILLER } from "../constants"
import { Cell } from "../types"
import { CellError, Result, fail, success } from "./types/errors"

// used in vue template
export function getCellIndexfromXY(x: number, y: number): number {
  return (y - 1) * (ALPHABET_WITH_FILLER.length - 1) + x - 1
}

// Takes cell name like 'A1', 'B99'.
// Returns index in one-dimensional cell array in the range(0, NUMBER_OF_CELLS from ../constants)
export function getIndexFromCellName(cellName: string): number {
  // These are based on the algo of the template in ../CellsCanvas.vue
  const x = ALPHABET_WITH_FILLER.indexOf(cellName[0].toUpperCase())
  const y = Number(cellName.slice(1)) + 1

  return getCellIndexfromXY(x, y)
}

// Calculate the range of cells between 2 given cells in the spreadsheet.
// Used in: custom functions like SUM(A2:B99).
//
// Takes 2 cell indices and the number of columns of the table
// (used to calculate the x-position of each cell.)
//
// Returns array of cell indices "in between" the two cells.
export function getCellsInRange(
  cellA: number,
  cellB: number,
  numOfCols: number,
): number[] {
  const [from, to] = [cellA, cellB].sort()
  const range: number[] = []

  // This algo exploits the fact that the cell data structure to which
  // args "from" and "to" refer is a simple, 1-dimensional array.
  //
  // First, determine amount of cells 'in between' from and to on the x axis.
  // (i.e. discounting their y offset)
  //
  // Where each is located on the x axis.
  const fromX = from % numOfCols
  const toX = to % numOfCols
  const delta = Math.abs(toX - fromX)

  const start = fromX < toX ? fromX : toX

  for (let blockStart = start; blockStart <= to; blockStart += numOfCols) {
    for (let cell = blockStart; cell <= blockStart + delta; cell++) {
      range.push(cell)
    }
  }

  return range
}

// Takes array of cell index(es) and the spreadsheet data.
// Returns cell values or
// error if any value is not a number.
export function getNumbersFromCells(
  cellsToResolve: number[],
  all: Cell[],
): Result<number[], CellError> {
  const values = []

  for (let i = 0; i < cellsToResolve.length; i++) {
    const cellToResolve = cellsToResolve[i]
    const val = all[cellToResolve].value
    if (typeof val !== "number") {
      return fail({
        type: "CELL_NOT_A_NUMBER",
        cell: cellToResolve,
      })
    }

    values.push(val)
  }
  return success(values)
}
