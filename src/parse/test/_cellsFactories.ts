// ############################
// --- SPREADSHEET FACTORIES ---
// OUT: Cell[]
// ############################
import { Cell } from "../../types/types"
import { createCell } from "../../test/INITIAL_DATA"
import { NUM_OF_COLS, NUM_OF_ROWS } from "../../config/constants"

export function createNumericSpreadsheet(
  x = NUM_OF_COLS,
  y = NUM_OF_ROWS,
): Cell[] {
  return [...new Array(x * y)].map(() => {
    const randomNatNoZero = Math.floor(Math.random() * 9999) + 1
    return createCell(randomNatNoZero)
  })
}

export function createEmptySpreadsheet(
  x = NUM_OF_COLS,
  y = NUM_OF_ROWS,
): Cell[] {
  return [...new Array(x * y)].map(() => {
    return createCell()
  })
}

export function createStringSpreadsheet(
  x = NUM_OF_COLS,
  y = NUM_OF_ROWS,
): Cell[] {
  return [...new Array(x * y)].map(() => {
    return createCell(undefined, "foo")
  })
}
