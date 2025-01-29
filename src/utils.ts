import type { Cell, CleanToken } from './types'
import { ALPHABET_WITH_FILLER, NUM_OF_ROWS } from "./constants"

function isCellName(s: string) {
    return /^\w\d\d?/.test(s.toLocaleLowerCase())
}
function getIndexFromCellName(cellName: string) {
    // cellName examples: 'A1', 'B99'
    // We call the letter x and the number y such as 'A0' === (1, 1)
    const x = ALPHABET_WITH_FILLER.indexOf(cellName[0])
    const y = Number(cellName.slice(1)) + 1

    return NUM_OF_ROWS * (x - 1) + y - 1
}

export const solveFormula = (input: string, cells: Cell[]): { error: string | undefined, cleanTokens: CleanToken[], result: number | undefined } => {
    const tokenize = (input: string): string[] => {
        // remove whitespaces
        const sanitizedInput = (s: string) => {
            // ...from edges
            const trimmedString = s.trim()
            const sanitizedString = trimmedString
            return sanitizedString
        }
        const tokens = sanitizedInput(input).split('+')

        return tokens.map(token => token.trim())
    }
    const parseTokens = (tokens: string[]): { error: string | undefined, cleanTokens: CleanToken[] } => {
        let error = undefined
        const cleanTokens: CleanToken[] = []

        for (const token of tokens) {
            if (!isNaN(Number(token))) {
                // token evaluates to a number
                cleanTokens.push({
                    indexOfOriginCell: -1,
                    value: Number(token)
                })
            } else {
                // token is a string
                if (isCellName(token)) {
                    const index = getIndexFromCellName(token)
                    const value = cells[index].value

                    if (isNaN(Number(value))) {
                        error = `Sorry, the referenced cell ${token} doesn't contain a valid number ¯\_(ツ)_/¯`
                    } else {
                        // referenced cell contains a number
                        cleanTokens.push({
                            indexOfOriginCell: index,
                            value: Number(cells[index].value)
                        })
                    }
                } else {
                    //token is string but not a cell name
                    error = `Sorry, I can't work with '${token}' ¯\_(ツ)_/¯`
                }
            }
        }

        return { error, cleanTokens }
    }

    let result: number | undefined = undefined;
    // let error: string | undefined = undefined

    const tokens: string[] = tokenize(input)
    const { error, cleanTokens }: { error: string | undefined, cleanTokens: CleanToken[] } = parseTokens(tokens)

    if (error === undefined) {
        result = cleanTokens.reduce((sum, cleanToken: CleanToken) => sum += cleanToken.value, 0)
    }

    return { error, cleanTokens, result }
}

export const isFormula = (input: string): boolean => {
    return input[0] === '='
}

export function propagateChanges(cells: Cell[], indexOfChangedCell: number) {
    let updatedCells = structuredClone(cells)

    updatedCells[indexOfChangedCell].cellsThatDependOnMe.forEach((indexOfCell) => {
        const cellToUpdate = updatedCells[indexOfCell]
        const { error, cleanTokens, result } = solveFormula(cellToUpdate.content, updatedCells)
        cellToUpdate.value = result
        updatedCells = propagateChanges(updatedCells, indexOfCell)
    })

    return updatedCells
}

export function updateCellDependencies(cells: Cell[], newTokens: CleanToken[], indexOfCell: number): Cell[] {
    const updatedCells = structuredClone(cells)
    const newCellsReferences: number[] = newTokens.filter((token: CleanToken) => token.indexOfOriginCell > -1).map(token => token.indexOfOriginCell)
    const oldCellsReferences: number[] = cells[indexOfCell].tokens.filter((token: CleanToken) => token.indexOfOriginCell > -1).map(token => token.indexOfOriginCell)
    const cellsThatLostDep: number[] = oldCellsReferences.filter(index => !newCellsReferences.includes(index))
    const cellsThatGainedDep: number[] = newCellsReferences.filter(index => !oldCellsReferences.includes(index))

    cellsThatLostDep.forEach((index) => {
        updatedCells[index].cellsThatDependOnMe.splice(updatedCells[index].cellsThatDependOnMe.indexOf(indexOfCell), 1)
    })
    cellsThatGainedDep.forEach((index) => {
        updatedCells[index].cellsThatDependOnMe.push(indexOfCell)
    })

    return updatedCells
}