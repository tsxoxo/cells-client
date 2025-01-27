export interface Cell {
    content: number,
    id: number,
    cellsThatDependOnMe: number[]
}