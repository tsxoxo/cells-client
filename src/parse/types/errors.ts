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

import { Token } from "./token"
import { Node } from "./ast"

export type ParseErrorType =
    | TokenizeErrorType
    | ASTErrorType
    | InterpretErrorType
// Error object that bubble up and get handled
export type ParseError = {
    type: ParseErrorType
    token: Pick<Token, "value" | "start">
    msg: string
    cellIndex?: number // Cell which contains an invalid value
    debugNode?: Node
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

export type ASTErrorType = "UNEXPECTED_TOKEN" | "PARENS"

export type InterpretErrorType = "DIVIDE_BY_0" | "OVERFLOW" | CellErrorType

export type CellErrorType = "CIRCULAR_CELL_REF" | "CELL_NOT_A_NUMBER"
