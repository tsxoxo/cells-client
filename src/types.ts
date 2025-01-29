export interface CleanToken {
    value: number,
    indexOfOriginCell: number
}
export interface Cell {
    value: string,
    content: string,
    tokens: CleanToken[],
    cellsThatDependOnMe: number[]
}