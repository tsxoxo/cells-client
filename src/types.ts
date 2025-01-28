export interface Cell {
    value: number | string,
    content: string,
    cellsThatDependOnMe: number[]
}