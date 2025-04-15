import type { AppError, Cell, CleanToken } from './types'
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
function parseToken(token: string, cells: Cell[]): { cleanToken: CleanToken, errorMessage: string } {
    let errorMessage = '';
    let indexOfOriginCell = -1
    let value: number = 0

    if (!isNaN(Number(token))) {
        // token evaluates to a number
        value = Number(token)
    } else {
        // token is a string
        if (isCellName(token)) {
            const index = getIndexFromCellName(token)
            if (cells[index] === undefined) {
                errorMessage = `Sorry, something went wrong! Please try something else ¯\_(ツ)_/¯`
            } else {
                if (isNaN(Number(cells[index].value))) {
                    errorMessage = `Sorry, the referenced cell ${token} doesn't contain a valid number ¯\_(ツ)_/¯`
                } else {
                    // referenced cell contains a number
                    indexOfOriginCell = index
                    value = Number(cells[index].value)
                }
            }
        } else {
            //token is string but not a cell name
            errorMessage = `Sorry, I can't work with '${token}' ¯\_(ツ)_/¯`
        }
    }

    return {
        errorMessage,
        cleanToken: {
            value,
            indexOfOriginCell
        }
    }
}
function parseTokens(tokens: string[], cells: Cell[]): { errorMessage: string, cleanTokens: CleanToken[] } {
    let errorMessage = ''
    const cleanTokens: CleanToken[] = []

    for (const token of tokens) {
        const { errorMessage: tokenErrorMessage, cleanToken } = parseToken(token, cells)

        if (tokenErrorMessage !== '') {
            errorMessage = tokenErrorMessage
            break
        } else {
            cleanTokens.push(cleanToken)
        }
    }

    return { errorMessage, cleanTokens }
}
function calculateResult(tokens: CleanToken[]): number {
    return tokens.reduce((sum, cleanToken) => sum += cleanToken.value, 0)
}

export const parseInput = (input: string, cells: Cell[]): { errorMessage: string, cleanTokens: CleanToken[] | [], value: string | number } => {
    let errorMessage: string = ''
    let cleanTokens: CleanToken[] | [] = []
    let value: string | number = input

    if (isFormula(input)) {
        // Skip the starting '=' of the formula
        const tokens: string[] = tokenize(input.slice(1));
        ({ errorMessage, cleanTokens } = parseTokens(tokens, cells))

        if (errorMessage === '') {
            value = calculateResult(cleanTokens)
        }
    }

    return { errorMessage, cleanTokens, value }
}



export function handleErrors(errors: AppError[] | []) {
    errors.length > 0 && errors.forEach(error => {
        console.log(`We've got an error in cell ${error.indexOfCell} -- keep calm and carry on!\nHere's the error message: ${error.message}`)
    }
    )
}
