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

import { and, between, sepBy, t } from "../utils/parse_combinators"
import { Token } from "./token"

//============================================================
// --- PATTERNS ----------------------------------------------
//============================================================
// Atoms
// TODO: think: should this be all parsers?
export const P_OPERATORS_BIN = ["+", "-", "*", "/"] as const
export type Operator = (typeof P_OPERATORS_BIN)[number]

export const P_OPERATORS_RANGE = [":"] as const
export type OperatorRange = (typeof P_OPERATORS_RANGE)[number]

export const P_OPERATORS_LIST = [","] as const
export type OperatorList = (typeof P_OPERATORS_LIST)[number]

export const P_CHARS_NUM = /[0-9,.]/

// Parsers
// Exported for testing
export const func_shell = {
    start: and(t("func"), t("parens_open")),
    end: t("parens_close"),
}

// Exported for testing
const rangeArg = and(t("cell"), t("op_range"), t("cell"))
export const Func_Range = {
    pattern: between(func_shell, rangeArg),
    toNode: {}, // (tokens: Token[]) => Node
}

const listArg = sepBy(t("cell"), t("op_list"))
export const Func_List = {
    pattern: between(func_shell, listArg),
    toNode: {}, // (tokens: Token[]) => Node
}

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
