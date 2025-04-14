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
// * Invalid op placement: "++", "1+4*5*"
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

// Define result types
export type Success<T> = { ok: true; value: T }
export type Error = { ok: false; error: string; position?: number }
export type Result<T> = Success<T> | Error

// Helper functions
export function success<T>(value: T): Success<T> {
  return { ok: true, value }
}

export function fail(error: string, position?: number): Error {
  return { ok: false, error, position }
}

// Type guard
export function isSuccess<T>(result: Result<T>): result is Success<T> {
  return result.ok === true
}

export type AppError = {
  // 'char', 'syntax', etc.
  type: string,
  // mb pass the token
  position: number
}

//export type Err_InvalidChar = {
//  char: string,
//  charIndex: number,
//  msg: string
//}
//
//export type Err_InvalidSyntax = {
//  node: string,
//  nodeIndex: number,
//  msg: string
//}
//
//export type Err_Parsing = {
//  nodeRaw: string,
//  nodeIndex: number,
//  msg: string
//}
