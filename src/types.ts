export interface Cell {
    value: number,
    cellsThatDependOnMe: number[]
}