import { Cell } from "./types"
import { NUMBER_OF_CELLS } from "./constants"

function makeCell(
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
export const INITIAL_CELLS: Cell[] = [...new Array(NUMBER_OF_CELLS)].map(
  (_, ind) => makeCell(),
)
INITIAL_CELLS[0] = makeCell(10, "", [], [2])
INITIAL_CELLS[1] = makeCell(11, "", [], [2])
INITIAL_CELLS[2] = makeCell(21, "=A0+B0", [0, 1], [26])
INITIAL_CELLS[26] = makeCell(31, "=A2+10", [2])
