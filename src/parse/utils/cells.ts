import { ALPHABET_WITH_FILLER, NUM_OF_COLS } from "../../config/constants"
import { Cell } from "../../types/types"
import { Result, fail, isSuccess, success } from "../types/result"
import { CellError } from "../types/errors"

//============================================================
// ==================== CELL API =============================
//
// Main function for extracting values from cells.
// Used in interpret parsing module.
// Returns fail when any cell does not contain a number.
//
//============================================================
type CellValueGetter = (
    cells: string[],
    currentIndex: number,
) => Result<
    {
        values: number[]
        indices: number[]
    },
    CellError
>

export type CellValueProvider = Record<string, CellValueGetter>

// Currying because working on a huge object is a pain DX-wise.
export function createCellValueProvider(
    cells: Cell[],
    numOfCols: number,
): CellValueProvider {
    return {
        getCellValue: getCellValue(cells),
        getCellValues: getCellValues(cells),
        getRangeValues: getRangeValues(cells, numOfCols),
    }
}
//============================================================
// CELL COORDINATES
//
// Helpers for converting cell names to cell indices.
// E.g. "A0" to 0
//
//============================================================
// Takes cell name like 'A1', 'B99'.
// Returns index in one-dimensional cell array in the range(0, NUMBER_OF_CELLS from ../constants),
export function getIndexFromCellName(cellName: string): number {
    // These are based on the algo of the template in ../CellsCanvas.vue
    const x = ALPHABET_WITH_FILLER.indexOf(cellName[0].toUpperCase())
    const y = Number(cellName.slice(1)) + 1

    return getCellIndexfromXY(x, y)
}

function getIndicesFromCellNames(cellNames: string[]): number[] {
    return cellNames.map((c) => getIndexFromCellName(c))
}

// Get cell index based on the coordinate scheme in our Vue template.
export function getCellIndexfromXY(x: number, y: number): number {
    return (y - 1) * NUM_OF_COLS + x - 1
}

//============================================================
// CELL VALUE EXTRACTORS
//
// Helpers for extracting values from cells.
//
//============================================================

// -------------------------------
// Get value from cell indices.
// -------------------------------
// Takes array of cell index(es) and the spreadsheet data.
// Returns numeric cell values or
// error if any value is not a number.
export function getNumbersFromCells(
    cellIndices: number[],
    cellsData: Cell[],
): Result<number[], CellError> {
    const values = []

    for (let i = 0; i < cellIndices.length; i++) {
        const cellIndex = cellIndices[i]
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

// -------------------------------
// Get value from single cell ref.
// -------------------------------
// Types defined on CellValueProvider
function getCellValue(cells: Cell[]): CellValueGetter {
    return ([cell], currentCellIndex) => {
        // Convert name to index.
        const cellIndex = getIndexFromCellName(cell)

        // Abort if the passed cell name refers back to the current cell.
        if (cellIndex === currentCellIndex) {
            return fail({ type: "CIRCULAR_CELL_REF" })
        }

        // Happy path: No circuar refs. Try to get all values.
        const cellValuesResult = getNumbersFromCells([cellIndex], cells)

        // Fail fast if some cell contains non-numeric value.
        if (!isSuccess(cellValuesResult)) {
            return cellValuesResult
        }

        // Happy path: cell's value is a number
        return success({
            values: [cellValuesResult.value[0]],
            indices: [cellIndex],
        })
    }
}

// -------------------------------
// Get values from list of cell refs.
// -------------------------------
// Types defined on CellValueProvider
function getCellValues(cells: Cell[]): CellValueGetter {
    return (cellNames, currentCellIndex) => {
        // Convert names to indices.
        const indices = getIndicesFromCellNames(cellNames)

        // Is any index in range a circular reference?
        if (indices.includes(currentCellIndex)) {
            return fail({ type: "CIRCULAR_CELL_REF" })
        }

        // Happy path: No circuar refs. Try to get all values.
        const cellValuesResult = getNumbersFromCells(indices, cells)

        // Fail fast if some cell contains non-numeric value.
        if (!isSuccess(cellValuesResult)) {
            return cellValuesResult
        }

        // Happy path
        // Return values in range and indices
        return success({
            values: cellValuesResult.value,
            indices,
        })
    }
}

// ---------------------
// Get values from range.
// ---------------------

// MAIN FUNCTION FOR HANDLING RANGE.
// Types defined on CellValueProvider
function getRangeValues(cells: Cell[], numOfCols: number): CellValueGetter {
    return ([fromName, toName], currentCellIndex) => {
        // Convert names to indices.
        const [from, to] = getIndicesFromCellNames([fromName, toName])

        // Arg order of from and to does not matter, cells get sorted in getCellsinRange.
        const indices = getCellsInRange(from, to, numOfCols)

        // Is any index a circular reference?
        if (indices.includes(currentCellIndex)) {
            return fail({ type: "CIRCULAR_CELL_REF" })
        }

        // Happy path: No circuar refs. Try to get all values.
        const valuesInRangeResult = getNumbersFromCells(indices, cells)

        // Fail fast if some cell contains non-numeric value.
        if (!isSuccess(valuesInRangeResult)) {
            return valuesInRangeResult
        }

        // Happy path
        // Return values in range and indices
        return success({
            values: valuesInRangeResult.value,
            indices,
        })
    }
}

// HELPER FUNCTION FOR HANDLING RANGE.
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
