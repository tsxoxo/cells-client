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
function isFormula(input: string): boolean {
    return input[0] === '='
}
function tokenize(input: string): string[] {
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
function parseToken(token: string, cells: Cell[]): { cleanToken: CleanToken, error: string | undefined } {
    let error = undefined;
    let indexOfOriginCell = -1
    let value: number = 0
    // let indexOfOriginCell = getIndexFromCellName(token)
    // let value = calculateValueOfToken(token)

    if (!isNaN(Number(token))) {
        // token evaluates to a number
        value = Number(token)
    } else {
        // token is a string
        if (isCellName(token)) {
            const index = getIndexFromCellName(token)

            if (isNaN(Number(cells[index].value))) {
                error = `Sorry, the referenced cell ${token} doesn't contain a valid number ¯\_(ツ)_/¯`
            } else {
                // referenced cell contains a number
                indexOfOriginCell = index
                value = Number(cells[index].value)
            }
        } else {
            //token is string but not a cell name
            error = `Sorry, I can't work with '${token}' ¯\_(ツ)_/¯`
        }
    }

    return {
        error,
        cleanToken: {
            value,
            indexOfOriginCell
        }
    }
}
function parseTokens(tokens: string[], cells: Cell[]): { error: string | undefined, cleanTokens: CleanToken[] } {
    let error = undefined
    // let cleanToken = undefined as CleanToken
    const cleanTokens: CleanToken[] = []

    for (const token of tokens) {
        const { error: tokenError, cleanToken } = parseToken(token, cells)

        if (tokenError !== undefined) {
            error = tokenError
            break
        } else {
            cleanTokens.push(cleanToken)
        }
    }

    return { error, cleanTokens }
}
function calculateResult(tokens: CleanToken[]): number {
    return tokens.reduce((sum, cleanToken) => sum += cleanToken.value, 0)
}

export const parseInput = (input: string, cells: Cell[]): { error: string | undefined, cleanTokens: CleanToken[] | [], value: string | number } => {
    let error: string | undefined = undefined
    let cleanTokens: CleanToken[] | [] = []
    let value: string | number = input

    if (isFormula(input)) {
        // Skip the starting '=' of the formula
        const tokens: string[] = tokenize(input.slice(1));
        ({ error, cleanTokens } = parseTokens(tokens, cells))

        if (error === undefined) {
            value = calculateResult(cleanTokens)
        }
    }

    return { error, cleanTokens, value }
}

export function propagateChanges(cells: Cell[], indexOfChangedCell: number) {
    let updatedCells = structuredClone(cells)

    updatedCells[indexOfChangedCell].cellsThatDependOnMe.forEach((indexOfCell) => {
        const cellToUpdate = updatedCells[indexOfCell]
        const { error, cleanTokens, result } = parseInput(cellToUpdate.content, updatedCells)
        cellToUpdate.value = result
        updatedCells = propagateChanges(updatedCells, indexOfCell)
    })

    return updatedCells
}

export function withUpdatedCellDependencies(cells: Cell[], newTokens: CleanToken[] | [], indexOfCell: number): Cell[] {
    const updatedCells = structuredClone(cells)
    const newCellsReferences: number[] | [] = newTokens.filter((token: CleanToken) => token.indexOfOriginCell > -1).map(token => token.indexOfOriginCell)
    const oldCellsReferences: number[] | [] = cells[indexOfCell].tokens.filter((token: CleanToken) => token.indexOfOriginCell > -1).map(token => token.indexOfOriginCell)
    const cellsThatLostDep: number[] | [] = oldCellsReferences.filter(index => !newCellsReferences.includes(index))
    const cellsThatGainedDep: number[] | [] = newCellsReferences.filter(index => !oldCellsReferences.includes(index))

    cellsThatLostDep.forEach((index) => {
        updatedCells[index].cellsThatDependOnMe.splice(updatedCells[index].cellsThatDependOnMe.indexOf(indexOfCell), 1)
    })
    cellsThatGainedDep.forEach((index) => {
        updatedCells[index].cellsThatDependOnMe.push(indexOfCell)
    })

    return updatedCells
}