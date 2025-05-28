// =================================================
// ERROR HANDLING
// =================================================
//
// # DESIGN PILLARS
// Make errors granular so that they can be communicated to user.
//
// ## Desired UI behavior
// A) Show a specific error message.
// B) Mark the erroneous token.
//
// --> Necessary data
// A) The type of error.
// B) The position or value of the invalid token.
//
// # ERROR TYPES
// * Lexical: INVALID_CHAR, INVALID_CELL, INVALID_NUMBER, UNKNOWN_FUNCTION
// * Syntax: UNEXPECTED_TOKEN, UNEXPECTED_EOF???
// * Semantics: CIRCULAR_REF
// * Evaluation: DIVIDE_BY_0, OUT_OF_BOUND
// * _Safety net: UNKNOWN_ERROR
//
// ## Questions
// * wrong func args?
// * Ill-formed token: "A999", "string" ??? INVALID_CELL_REF vs INVALID_CELL_VAL
//
// ## DETAILS
// * [INVALID_CHAR] Invalid character, e.g. "$" in "1+2$"
// TODO: Possibly delete this (see INVALID_CELL, _NUMBER, _IDENTIFIER)
// * [UNKNOWN_TOKEN] Valid chars, malformed or non-existing token: "A999", "foo()"
//      --> tokenize
//
// * [UNEXPECTED_TOKEN] Valid token in invalid place: SUM(A3*5)
// * [CIRCULAR_REF] Cell references itself, e.g. in A1 "A0+A1", "SUM(A0:B4)"
//      --> ast, more???
//
// * [INVALID_CELL] Invalid value from cell reference: "A1 + A2", where A1 === 'something invalid'
// * [OUT_OF_BOUND] Number too big (applies to single nums as well as result of calc. should be checked after evaluating cell reference)
// * [DIVIDE_BY_0] Divide by 0
//      --> interpret
//
// * [UNKNOWN_ERROR]: Safety net. Not sure if we ever hit this one. Possibly throw instead.
//      --> tokenizer

import { Node_Binary, Token, Tree } from "./grammar"

type ErrorType =
  // Split into INVALID_CHAR (lex)
  // and UNEXPECTED_TOKEN (synt)
  //
  | "INVALID_CHAR"
  | "INVALID_CELL"
  | "INVALID_NUMBER"
  | "UNKNOWN_FUNCTION"
  | "TOKEN"
  // merge next two?
  | "UNKNOWN_OP"
  | "UNKNOWN_FUNC"
  // merge into UNEXPECTED_TOKEN?
  | "UNEXPECTED_EOF"
  // necessary?
  | "UNEXPECTED_NODE"
  // value or ref?
  | "INVALID_CELL"
  // EVALUATION
  | "DIVIDE_BY_0"
  // mismatched parens?
  | "PARENS"
  | "UNKNOWN_ERROR"

// Define result types
export type Result<T, E = Error> = Success<T> | Failure<E>

export type Success<T> = { ok: true; value: T }
export type Failure<E> = { ok: false; error: E }

export type AppError = {
  indexOfCell: number
  cause: ParseError | InterpretError | UnknownError
}

export type InterpretError = BaseError & {
  // null for UNEXPECTED_EOF
  node: Tree | null
}
export type ParseError = BaseError & {
  // null for UNEXPECTED_EOF
  token: Token | null
}
export type CellError = BaseError & {
  cell: number
}
export type UnknownError = BaseError & {
  type: "UNKNOWN_ERROR"
  err: unknown
}

export type BaseError = {
  type: ErrorType
  msg?: string
}

// Helper functions
export function pipe<T, E, R>(
  initValue: Result<T, E>,
  ...fns: Array<(res: Result<unknown, E>) => Result<unknown, E>>
): Result<R, E> {
  return fns.reduce(
    (acc, fn) => fn(acc as Result<unknown, E>),
    initValue as unknown as Result<unknown, E>,
  ) as Result<R, E>
}

export function flatMap<T, U, E>(
  res: Result<T, E>,
  fn: (val: T) => Result<U, E>,
): Result<U, E> {
  return res.ok ? fn(res.value) : res
}

export function bind<T, U, E>(
  fn: (val: T) => Result<U, E>,
): (res: Result<T, E>) => Result<U, E> {
  return (val) => flatMap(val, fn)
}

export function success<T>(value: T): Success<T> {
  return { ok: true, value }
}

export function fail<E>(error: E): Failure<E> {
  return { ok: false, error }
}

// Type guard
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.ok === true
}

export function assertBinaryOp(node: Tree): asserts node is Node_Binary {
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
