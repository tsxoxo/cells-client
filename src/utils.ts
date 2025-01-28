export const solveFormula = (input: string): { error: string | undefined, result: number | undefined } => {
    const tokenize = (input: string): string[] => {
        // remove whitespaces
        const sanitizedInput = (s: string) => {
            // ...from edges
            const trimmedString = s.trim()
            const sanitizedString = trimmedString
            return sanitizedString
        }
        const tokens = sanitizedInput(input).split('+')

        return tokens
    }
    const validateTokens = (tokens: string[]): (string | undefined) => {
        let errorMessage = undefined
        for (const token of tokens) {
            if (isNaN(Number(token))) {
                errorMessage = `${token} is not a number!`
                break
            }
            if (token === null) {
                errorMessage = `null___null`
                break
            }
            if (token === 'true') {
                errorMessage = `true___true`
                break
            }
        }

        return errorMessage
    }

    let result: number | undefined = undefined;
    let error: string | undefined = undefined

    const tokens: string[] = tokenize(input)
    error = validateTokens(tokens)

    if (error === undefined) {
        result = tokens.reduce((sum, token) => sum += Number(token), 0)
    }

    return { error, result }
}

export const isFormula = (input: string): boolean => {
    return input[0] === '='
}