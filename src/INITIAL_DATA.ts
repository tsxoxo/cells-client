import { Cell } from "./types"
import { NUMBER_OF_CELLS } from "./constants"

const EMPTY_CELL: Cell = {
  value: undefined,
  content: "",
  dependencies: [],
  dependents: [],
}
export const INITIAL_CELLS: Cell[] = [...new Array(NUMBER_OF_CELLS)].map(
  () => EMPTY_CELL,
)
INITIAL_CELLS[0] = {
  value: 10,
  content: "10",
  dependencies: [],
  dependents: [2],
}
INITIAL_CELLS[1] = {
  value: 11,
  content: "11",
  dependencies: [],
  dependents: [2],
}
INITIAL_CELLS[2] = {
  value: 21,
  content: "=A0+A1",
  dependencies: [0, 1],
  dependents: [102],
}
INITIAL_CELLS[102] = {
  value: 31,
  content: "=A2+10",
  dependencies: [2],
  dependents: [],
}
