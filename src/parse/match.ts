import { FUNCTION_KEYWORDS, FunctionKeyword } from "./func"
import {
    P_CHARS_NUM,
    P_OPERATORS_BIN,
    P_OPERATORS_RANGE,
    Operator,
    OperatorRange,
} from "./types/grammar"

export const cellPatternAnchored = /^[a-zA-Z]{1}[0-9]{1,2}$/

//==========================
// ATOMS
// Individual characters
//==========================
export function isDigit(str: string): boolean {
    return /^[0-9]$/.test(str)
}

export function isDigitOrComma(str: string): boolean {
    return P_CHARS_NUM.test(str)
}

export function isLetter(str: string): boolean {
    return /^[a-zA-Z]$/.test(str)
}

export function isWhitespace(str: string): boolean {
    return /^\s$/.test(str)
}

//==========================
// TOKENS
//==========================
export function isNumber(str: string): boolean {
    // Allow both "," and "." for float input.
    return /^\d+(?:(?:,|\.)\d+)?$/.test(str)
}

export function isCellRef(str: string): boolean {
    // Allow both formats: "A1" and "A01"
    return cellPatternAnchored.test(str)
}

export function isOp(str: string): boolean {
    return P_OPERATORS_BIN.includes(str as Operator)
}

export function isOpRange(str: string): boolean {
    return P_OPERATORS_RANGE.includes(str as OperatorRange)
}

export function isParensOpen(str: string): boolean {
    return /^\($/.test(str)
}
export function isParensClose(str: string): boolean {
    return /^\)$/.test(str)
}

export function isFunc(str: string): str is FunctionKeyword {
    const normalizedStr = str.toLowerCase() as FunctionKeyword
    return FUNCTION_KEYWORDS.includes(normalizedStr as FunctionKeyword)
}
