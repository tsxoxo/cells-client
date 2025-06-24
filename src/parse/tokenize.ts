// ========================================================
// TOKENIZER
// ========================================================
//
// Tokenizes a string. First module of parse pipeline.
//
// IN: string.
// OUT: array of objects that are easier to work with.
//
// Example
// IN: "11*(2+3)"
// OUT (simplified): [{ value: "11"}, {value: "*"}, ...]
//
// NB: Fails fast -- Throws on the first error

import {
    isCellRef,
    isFunc,
    isDigit,
    isOp,
    isParensOpen,
    isWhitespace,
    isDigitOrComma,
    isLetter,
    isNumber,
    isParensClose,
    isOpRange,
} from "./match"

import {
    BrokenToken,
    Failure,
    ParseError,
    Result,
    TokenizeErrorType,
    fail,
    isSuccess,
    success,
} from "./types/errors"

import { Token } from "./types/grammar"

// Main API
// IN: string
// OUT: Token[]
//
// Feeds the string to getNextToken, bit by bit,
// and accrues the token array if result is ok.
export function tokenize(
    str: string,
): Result<Token[], ParseError & { payload: BrokenToken }> {
    const tokens = [] as Token[]
    let ind = 0

    while (ind < str.length) {
        // Ignore whitespace
        if (isWhitespace(str[ind])) {
            ind++
            continue
        }

        const result = getNextToken(ind, str)

        // Fail fast.
        if (!isSuccess(result)) {
            return result
        }

        // Happy path.
        // Add to token array.
        const token = result.value
        tokens.push(token)
        ind += token.value.length
    }

    // loop is over with no errors
    return success(tokens)
}

// The meat and potatoes of token matching.
//
// IN: string, startIndex
// OUT: valid Token or error
//
// Uses matchers
function getNextToken(
    start: number,
    str: string,
): Result<Token, ParseError & { payload: BrokenToken }> {
    // const token = createEmptyToken(start)
    const char = str[start]

    // It's a standard arithmetic operator: +, -, *, /
    if (isOp(char)) {
        return success({
            type: "op",
            value: char,
            start,
        })
    }

    // It's the range operator: [:]
    if (isOpRange(char)) {
        return success({
            type: "op_range",
            value: char,
            start,
        })
    }

    // It's a parens: ( or )
    if (isParensOpen(char)) {
        return success({
            type: "parens_open",
            value: char,
            start,
        })
    }

    // It's a parens: ( or )
    if (isParensClose(char)) {
        return success({
            type: "parens_close",
            value: char,
            start,
        })
    }

    // It's a digit, so we accrue all following numeric symbols.
    if (isDigit(char)) {
        let maybeNumber = char
        let ind = start

        while (++ind < str.length) {
            const nextChar = str[ind]

            // Accrue valid char
            if (isDigitOrComma(nextChar)) {
                maybeNumber += nextChar

                continue
            }

            // Stop loop on anything else
            break
        }

        // Validate result.
        // Value could be "1.2.3" at this point.
        if (!isNumber(maybeNumber)) {
            return createError({
                type: "INVALID_NUMBER",
                payload: { start, value: maybeNumber },
                expected: "number",
            })
        }

        return success({
            type: "number",
            value: maybeNumber,
            start,
        })
    }

    // It's a letter, so we accrue all following letters and digits.
    // Could be either a cell reference (A11) or a function keyword (sum)
    if (isLetter(char)) {
        let maybeCellOrFunc = char
        let ind = start

        while (++ind < str.length) {
            const nextChar = str[ind]

            // Accrue valid char
            if (isLetter(nextChar) || isDigit(nextChar)) {
                maybeCellOrFunc += nextChar

                continue
            }

            // Stop loop on anything else
            break
        }

        // Validate result.
        // Separate cells from functions, throw away the rest.
        // prettier-ignore
        const tokenType = 
        isCellRef(maybeCellOrFunc) ? "cell" 
      : isFunc(maybeCellOrFunc) ? "func"
      : null

        if (tokenType) {
            return success({
                type: tokenType,
                value: maybeCellOrFunc,
                start,
            })
        }

        return createError({
            type: "INVALID_TOKEN",
            payload: { value: maybeCellOrFunc, start },
            expected:
                "cell reference (e.g. 'A42') or function keyword (e.g. 'sum')",
        })
    }

    // Neither an op, a parens, a number, a cell, or a function keyword.
    // Examples: ~`^'$
    return createError({
        type: "INVALID_CHAR",
        payload: { value: char, start },
        expected: "valid character",
    })
}

// =================================================
// UTILS
// =================================================
// Factories
function createError({
    type,
    payload,
    expected,
}: {
    type: TokenizeErrorType
    payload: BrokenToken
    expected: string
}): Failure<ParseError & { payload: BrokenToken }> {
    return fail({
        type,
        payload,
        msg: `${type} in Tokenizer: expected [${expected}], got [${payload.value}]`,
    })
}
