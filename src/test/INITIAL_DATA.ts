import { Cell } from "../types/types"
import { NUMBER_OF_CELLS } from "../config/constants"

export function createCell(
  val = undefined as number | undefined,
  cont = "",
  dependencies = [] as number[],
  dependents = [] as number[],
): Cell {
  return {
    value: val,
    content: cont ? cont : String(val),
    dependencies,
    dependents,
  }
}
export const INITIAL_CELLS: Cell[] = [...new Array(NUMBER_OF_CELLS)].map(() =>
  createCell(),
)
INITIAL_CELLS[0] = createCell(10, "", [], [2])
INITIAL_CELLS[1] = createCell(11, "", [], [2])
INITIAL_CELLS[2] = createCell(21, "=A0+B0", [0, 1], [26])
INITIAL_CELLS[26] = createCell(31, "=A2+10", [2])
