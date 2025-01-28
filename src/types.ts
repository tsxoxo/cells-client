export interface Cell {
    value: string,
    content: string,
    cellsThatDependOnMe: number[]
}

export interface CleanToken {
    value: number,
    indexOfOriginCell: number
}