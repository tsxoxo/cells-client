// =================================================
// ERROR HANDLING
// =================================================
//
// # DESIGN PILLARS
// Make errors granular so that they can be communicated to user.
//
// ## Desired UI behavior
// A) Show an error message.
// B) Mark the erroneous token.
//
// --> Necessary data
// A) The type of error.
// B) The start and end position of the invalid token.
//
// ## ERROR TYPES
//
// ### [TOKEN] Invalid or ill-formed tokens
//      --> tokenizer
// * Invalid char: "#%`[$=" etc.
// * Ill-formed token: "A999", "string"
//
// * [INVALID_CELL] Invalid value from cell reference: "A1 + A2", where A1 === 'something invalid'
//      --> interpret
//
// ### "Out-of-bounds"
//      --> ast
// * Number too big (single num as well as result of calc. should be checked after evaluating cell reference)
// * [DIVIDE_BY_0] Divide by 0
//
// * Circular cell reference
//
// ### Invalid syntax
//      --> ast
// * Bracket placement
// * Invalid op placement:
//      * "++"
//      * [UNEXPECTED_EOF] "1+4*5*"
//
//
// ### Functions (future feature)
//
// ### Ranges (future feature)
//
//
// TODO:
// * develop testing strategy. look at .each syntax
// * write/refactor tests for parsing units
// * write tests for UI

// Is UNEXPECTED_NODE really necessary?
type ErrorType =
  | "TOKEN"
  | "UNKNOWN_OP"
  | "UNEXPECTED_EOF"
  | "UNEXPECTED_NODE"
  | "INVALID_CELL"
  | "DIVIDE_BY_0"
  | "PARENS"

// Define result types
export type Result<T, E = Error> = Success<T> | Failure<E>

export type Success<T> = { ok: true; value: T }
export type Failure<E> = { ok: false; error: E }

export type ParseError = {
  type: ErrorType
  position?: number
  info?: string
}

export type AppError = {
  indexOfCell: number
  cause: ParseError
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
