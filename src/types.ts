export interface Cell {
    content: number,
    cellsThatDependOnMe: number[]
}