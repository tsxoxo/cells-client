// =================================================
// ERROR HANDLING
// =================================================
//
// # DESIGN PILLARS
// ----------------
// Make errors granular so that they can be communicated to user.
//
// ## Desired UI behavior
// A) Show a specific error message.
// B) Mark the erroneous token.
//
// --> Necessary data
// A) The type of error.
// B) The position of the bad token.
//
// ## Details for error types
// * [INVALID_xyz] INVALID_CELL, _CHAR and _NUMBER catch invalid chars like $^/ as well.
// * [INVALID_CHAR] catches chars outside of the above 3 parsing contexts (e.g. in first pos)
//      --> tokenize
//
// * [UNEXPECTED_TOKEN] Valid token in invalid place: SUM(A3*5)
//      --> ast
//
// * [CELL_NOT_A_NUMBER] Non-numeric value from cell reference. "A1 + A2" and A1 contains "foo".
// * [CIRCULAR_CEL_REF] Cell references itself, e.g. in A1 "A0+A1", "SUM(A0:B4)"
// * [DIVIDE_BY_0] Divide by 0
//      --> interpret

import { Node_Binary, Token, Node } from "./grammar"

// Error object that bubble up and get handled
export type ParseError = {
    type: TokenizeErrorType | ASTErrorType | InterpretErrorType
    payload: BrokenToken | Token | Node
    msg: string
    cellIndex?: number // Cell which contains an invalid value
}

export type CellError = {
    type: CellErrorType
    cellIndex?: number
}

// Base types for parsing errors
// See section ## DETAILS above.
export type TokenizeErrorType =
    | "INVALID_CHAR" // For cases like $, ?, ^
    | "INVALID_NUMBER" // For cases like "1.2,3"
    | "INVALID_TOKEN" // For things like "foo", "a999"

export type BrokenToken = {
    value: string
    start: number
}

export type ASTErrorType = "UNEXPECTED_TOKEN" | "PARENS"

export type InterpretErrorType = "DIVIDE_BY_0" | "OVERFLOW" | CellErrorType

export type CellErrorType = "CIRCULAR_CELL_REF" | "CELL_NOT_A_NUMBER"

// ########################################################################
// RESULT PATTERN
// ########################################################################
export type Result<T, E> = Success<T> | Failure<E>
export type Success<T> = { ok: true; value: T }
export type Failure<E> = { ok: false; error: E }

export function success<T>(value: T): Success<T> {
    return { ok: true, value }
}

export function fail<E>(error: E): Failure<E> {
    return { ok: false, error }
}

// Type guards
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
    return result.ok === true
}

export function assertNever(
    module: string,
    context: string,
    obj: never,
): never {
    throw new Error(
        `Module [${module}] encountered unknown [${context}]: ${JSON.stringify(obj, null, 2)}`,
    )
}

// Used for testing
export function assertBinaryOp(node: Node): asserts node is Node_Binary {
    if (node.type !== "binary_op") {
        throw new Error(
            `node is not of type "binary_op! node: ${JSON.stringify(node, null, 2)}`,
        )
    }
}

export function assertIsSuccess<T, E>(
    result: Result<T, E>,
): asserts result is Success<T> {
    if (!result.ok) {
        throw new Error(
            `result is not a success! error: ${JSON.stringify(result.error, null, 2)}`,
        )
    }
}

export function assertIsFail<T, E>(
    result: Result<T, E>,
): asserts result is Failure<E> {
    if (result.ok) {
        throw new Error(
            `result is not a fail! value: ${JSON.stringify(result.value, null, 2)}`,
        )
    }
}
