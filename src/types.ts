export interface CleanToken {
    value: number,
    indexOfOriginCell: number
}
export interface Cell {
    value: string | number,
    content: string,
    tokens: CleanToken[],
    cellsThatDependOnMe: number[]
}

export interface AppError {
    indexOfCell: number,
    message: string
}