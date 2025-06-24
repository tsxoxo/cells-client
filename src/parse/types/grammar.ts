// =================================================
// # GRAMMAR
// =================================================
//
// * expression ::= term (('+' | '-') term)*
// * term ::= factor (('*' | '/') factor)*
// * factor ::= number | cell | '(' expression ')' | function
// * function ::= ('MULT' | 'SUM') '(' range ')'
// * range ::=  cell ':' cell
// * number ::= [0-9]+ (( ',' | '.' ) [0-9]+)?
// * cell ::= [a-zA-Z][0-9][0-9]?
//
// ## RegEx
// * Bracket: /[()]/
// * Operator: /[+-\/*]{1}/
// * Number: /[0-9]+((,|\.)[0-9]+)?/
// * Cell_ref: /[a-zA-Z]{1}[0-9]{1,2}
// TODO: move matchers here, export one big matcher object.

import { FunctionKeyword } from "../func"

export const OPS = ["+", "-", "*", "/", ":"] as const
export type Operator = (typeof OPS)[number]

export const CHARS_NUM = /[0-9,.]/

//============================================================
// --- TOKENS ------------------------------------------------
//============================================================
export type TokenType =
    | "number"
    | "cell"
    | "op" // TODO: call this "op_bin"
    | "op_range"
    | "parens_open"
    | "parens_close"
    | "func"
    | undefined // Used for INVALID_CHAR error and as initial value in factory function.
    | "eof" // Used for end-of-file error

export type Token = {
    value: string
    type: TokenType
    start: number
}

// ============================================================
// --- AST ----------------------------------------------------
// ============================================================
export type Node = Node_Binary | Node_Number | Node_Cell | Node_Func

interface Node_Base {
    type: string
    value: string
    start: number // Position of corresponding token within the formula string. Currently used only in failure cases.
}

// For binary operations: ['+', '-', '*', '/'],
export interface Node_Binary extends Node_Base {
    type: "binary_op"
    left: Node
    right: Node
}

export interface Node_Number extends Node_Base {
    type: "number"
}

export interface Node_Cell extends Node_Base {
    type: "cell"
}

export interface Node_Func extends Node_Base {
    type: "func"
    value: FunctionKeyword
    from: Node_Cell
    to: Node_Cell
}
