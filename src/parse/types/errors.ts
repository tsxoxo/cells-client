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
// * [CELL_UNDEFINED] Attempt to get cell from cells array returned undefined: cell is empty.
// * [CIRCULAR_CEL_REF] Cell references itself, e.g. in A1 "A0+A1", "SUM(A0:B4)"
// * [DIVIDE_BY_0] Divide by 0
//      --> interpret
//
// * [UNKNOWN_ERROR]: Safety net. Not sure if we ever hit this one. Possibly throw instead.
//      --> tokenizer

import { Node_Binary, Token, Node } from "./grammar"

// Error object that bubble up and get handled
export type ParseError = {
  type: TokenizeErrorType | ASTErrorType | InterpretErrorType
  payload: Token | Node
  msg: string
  cell?: number // Cell index which contains an invalid value
}

// Base types for parsing errors
// See section ## DETAILS above.
export type TokenizeErrorType =
  | "INVALID_CHAR"
  | "INVALID_CELL"
  | "INVALID_NUMBER"
  | "UNKNOWN_FUNCTION"
  | "UNKNOWN_ERROR"

export type ASTErrorType = "UNEXPECTED_TOKEN" | "PARENS"

export type InterpretErrorType =
  | "CELL_NOT_A_NUMBER"
  | "CELL_UNDEFINED"
  | "CIRCULAR_CELL_REF"
  | "DIVIDE_BY_0"
  | "UNKNOWN_FUNCTION" // Safety net if tokenizer fails. Not sure if we really need this.
  | "UNKNOWN_ERROR"

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

// Used for testing
export function assertBinaryOp(node: Node): asserts node is Node_Binary {
  if (node.type !== "binary_op") {
    throw new Error(
      `node is not of type "binary_op! node: ${JSON.stringify(node)}`,
    )
  }
}

export function assertIsSuccess<T, E>(
  result: Result<T, E>,
): asserts result is Success<T> {
  if (!result.ok) {
    throw new Error(
      `result is not a success! error: ${JSON.stringify(result.error)}`,
    )
  }
}

export function assertIsFail<T, E>(
  result: Result<T, E>,
): asserts result is Failure<E> {
  if (result.ok) {
    throw new Error(
      `result is not a fail! value: ${JSON.stringify(result.value)}`,
    )
  }
}
