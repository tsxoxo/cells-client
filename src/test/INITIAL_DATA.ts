import { Cell } from "../types/types"
import { NUMBER_OF_CELLS } from "../config/constants"

export function createCell({
    value = undefined as number | undefined,
    content = "",
    dependencies = [] as number[],
    dependents = [] as number[],
    ownIndex = -1,
}): Cell {
    return {
        value,
        content: content ? content : String(value),
        dependencies,
        dependents,
        ownIndex,
    }
}
export const INITIAL_CELLS: Cell[] = [...new Array(NUMBER_OF_CELLS)].map(
    (_, ind) => createCell({ ownIndex: ind }),
)
INITIAL_CELLS[0] = createCell({
    value: 10,
    content: "",
    dependencies: [],
    dependents: [2],
    ownIndex: 0,
})
INITIAL_CELLS[1] = createCell({
    value: 11,
    content: "",
    dependencies: [],
    dependents: [2],
    ownIndex: 1,
})
INITIAL_CELLS[2] = createCell({
    value: 21,
    content: "=A0+B0",
    dependencies: [0, 1],
    dependents: [26],
    ownIndex: 2,
})
INITIAL_CELLS[26] = createCell({
    value: 31,
    content: "=A2+10",
    dependencies: [2],
    ownIndex: 26,
})
