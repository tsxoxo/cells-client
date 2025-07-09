// ===============================================================
// --- GRAMMAR -------------------------------------------------
//
// The fundamental rules and patterns used in the parser.
// ===============================================================
//
// * expression ::= term (('+' | '-') term)*
// * term ::= factor (('*' | '/') factor)*
// * factor ::= number | cell | '(' expression ')' | function
// * function ::= ('MULT' | 'SUM') '(' range ')'
// * range ::=  cell ':' cell
// * number ::= [0-9]+ (( ',' | '.' ) [0-9]+)?
// * cell ::= [a-zA-Z][0-9][0-9]?
//
// TODO: move matchers here, export one big matcher object.

import { Token } from "./token"

//============================================================
// --- PATTERNS ----------------------------------------------
//============================================================
// Atoms
export const P_OPERATORS_BIN = ["+", "-", "*", "/"] as const
export type Operator = (typeof P_OPERATORS_BIN)[number]

export const P_OPERATORS_RANGE = [":"] as const
export type OperatorRange = (typeof P_OPERATORS_RANGE)[number]

export const P_OPERATORS_LIST = [","] as const
export type Operatorlist = (typeof P_OPERATORS_LIST)[number]

export const P_CHARS_NUM = /[0-9,.]/

// Molecules
type Molecule = {
    readonly pattern: Pick<Token, "type">[]
    readonly extract: (tokens: Token[]) => Token[]
}

const FunctionRange: Molecule = {
    pattern: [
        { type: "func" },
        { type: "parens_open" },
        { type: "cell" },
        { type: "op_range" },
        { type: "cell" },
        { type: "parens_close" },
    ],
    extract: ([_, __, cell1, ___, cell2, ____]) => {
        return [cell1, cell2]
    },
}

export const PATTERNS = {
    FunctionRange,
}
