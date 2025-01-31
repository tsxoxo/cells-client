import { Cell } from "./types";
import { NUMBER_OF_CELLS } from "./constants";

const EMPTY_CELL: Cell = {
    value: '',
    content: '',
    tokens: [],
    cellsThatDependOnMe: []
}
export const INITIAL_CELLS: Cell[] = [...new Array(NUMBER_OF_CELLS)].map(() => EMPTY_CELL)
INITIAL_CELLS[0] = {
    value: '10',
    content: '10',
    tokens: [{ value: 10, indexOfOriginCell: -1 }],
    cellsThatDependOnMe: [2]
}
INITIAL_CELLS[1] = {
    value: '11',
    content: '11',
    tokens: [{ value: 11, indexOfOriginCell: -1 }],
    cellsThatDependOnMe: [2]
}
INITIAL_CELLS[2] = {
    value: '21',
    content: '=A0+A1',
    tokens: [
        { value: 10, indexOfOriginCell: 0 },
        { value: 11, indexOfOriginCell: 1 },
    ],
    cellsThatDependOnMe: [102]
}
INITIAL_CELLS[102] = {
    value: '31',
    content: '=A2+10',
    tokens: [
        { value: 21, indexOfOriginCell: 2 },
        { value: 10, indexOfOriginCell: -1 }
    ],
    cellsThatDependOnMe: []
}