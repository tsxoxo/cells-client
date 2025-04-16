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
// * Invalid value from cell reference: "A1 + A2", where A1 === 'something invalid'
//      --> ast
//
// ### "Out-of-bounds"
//      --> ast
// * Number too big (single num as well as result of calc. should be checked after evaluating cell reference)
// * Divide by 0
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
// * bubble up errors and show in UI 
// * develop testing strategy. look at .each syntax
// * write/refactor tests for parsing units
// * write tests for UI

type ErrorType = "TOKEN" | "UNKNOWN_OP" | "UNEXPECTED_EOF"

// Define result types
export type Result<T, E = Error> = Success<T> | Failure<E>

export type Success<T> = { ok: true; value: T }
export type Failure<E> = { ok: false; error: E }


export type ParseError = { 
  type: ErrorType,
  position?: number 
}

export type AppError = {
  indexOfCell: number,
  cause: ParseError
}

// Helper functions
export function pipe<T, E>(initValue: Result<T, E>, ...fns: Array<(res: Result<any, E>,) => Result<any, E>> ): Result<any, E> {
  return fns.reduce( (acc, fn) => fn(acc), initValue)
}

export function flatMap<T, U, E>(res: Result<T, E>, fn: (val: T) => Result<U, E>): Result<U, E>  {
  return res.ok ? fn(res.value) : res
}

export function bind<T, U, E>(fn: (val: T) => Result<U, E>): (res: Result<T, E>) => Result<U, E> {
  return val => flatMap(val, fn)
}

export function success<T>(value: T): Success<T> {
  return { ok: true, value }
}

export function fail<E>( error: E): Failure<E> {
  return { ok: false, error }
}

// Type guard
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.ok === true
}

