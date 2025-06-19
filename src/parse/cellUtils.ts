import { ALPHABET_WITH_FILLER } from "../config/constants"
import { Cell } from "../types/types"
import { Result, fail, isSuccess, success } from "./types/errors"

//============================================================
// CELL COORDINATES
//
// Helpers for converting cell name to cell index.
// E.g. "A0" to 0
//
//============================================================
// Get cell index based on the coordinate scheme in our Vue template.
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

//============================================================
// CELL API
//
// API for extracting values from cells.
// Used in interpret parsing module.
// Returns fail when any cell does not contain a number.
//
//============================================================
export interface CellValueProvider {
  getCellValue(
    cellName: string,
    currentCellIndex?: number,
  ): Result<
    { cellValue: number; cellIndex: number },
    { type: string; cellIndex?: number }
  >

  getRangeValues(
    fromName: string,
    toName: string,
    currentCellIndex?: number,
  ): Result<
    { cellValuesInRange: number[]; cellIndexesInRange: number[] },
    { type: "CIRCULAR_CELL_REF" | "CELL_NOT_A_NUMBER"; cellIndex?: number }
  >
}

export function createCellValueProvider(cells: Cell[], numOfCols: number) {
  return {
    getCellValue(
      cellName: string,
      currentCellIndex?: number,
    ): Result<
      { cellValue: number; cellIndex: number },
      { type: string; cellIndex?: number }
    > {
      // Convert name to index and check if it's us.
      const cellIndex = getIndexFromCellName(cellName)
      if (currentCellIndex !== undefined && cellIndex === currentCellIndex) {
        return fail({ type: "CIRCULAR_CELL_REF" })
      }

      // Get the value
      const cell = cells[cellIndex]
      if (cell === undefined || typeof cell.value !== "number") {
        return fail({
          type: "CELL_NOT_A_NUMBER",
          cellIndex,
        })
      }

      // Happy path: cell's value is a number
      return success({ cellValue: cell.value, cellIndex })
    },

    getRangeValues(
      fromName: string,
      toName: string,
      currentCellIndex?: number,
    ): Result<
      { cellValuesInRange: number[]; cellIndexesInRange: number[] },
      { type: "CIRCULAR_CELL_REF" | "CELL_NOT_A_NUMBER"; cellIndex?: number }
    > {
      const from = getIndexFromCellName(fromName)
      const to = getIndexFromCellName(toName)

      // Arg order of from and to does not matter, cells get sorted in getCellsinRange.
      const cellIndexesInRange: number[] = getCellsInRange(from, to, numOfCols)

      // Does range contain circular reference?
      for (let i = 0; i < cellIndexesInRange.length; i++) {
        if (cellIndexesInRange[i] === currentCellIndex) {
          return fail({
            type: "CIRCULAR_CELL_REF",
          })
        }
      }

      // No circuar refs. Try to get all values.
      const valuesInRangeResult = getNumbersFromCells(cellIndexesInRange, cells)

      if (!isSuccess(valuesInRangeResult)) {
        // Some cell contains non-numeric value.
        // Enrich error from getNumbersFromCells
        return fail({
          type: valuesInRangeResult.error.type, // "CELL_NOT_A_NUMBER"
          cellIndex: valuesInRangeResult.error.cellIndex,
          expected: "all cells in range to contain valid numbers",
        })
      }

      // Happy path
      // return values in range and indexes
      return success({
        cellValuesInRange: valuesInRangeResult.value,
        cellIndexesInRange,
      })
    },
  }
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
  cellIndexes: number[],
  cellsData: Cell[],
): Result<number[], { type: "CELL_NOT_A_NUMBER"; cellIndex: number }> {
  const values = []

  for (let i = 0; i < cellIndexes.length; i++) {
    const cellIndex = cellIndexes[i]
    const cell = cellsData[cellIndex]

    // Fail immediately on any non-numeric value
    if (cell === undefined || typeof cell.value !== "number") {
      return fail({
        type: "CELL_NOT_A_NUMBER",
        cellIndex,
      })
    }

    // Happy path
    // Add value to result array
    values.push(cell.value)
  }
  return success(values)
}
