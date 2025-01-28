export interface Cell {
    value: string,
    cellsThatDependOnMe: number[]
}