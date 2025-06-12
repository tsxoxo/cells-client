import * as fc from "fast-check"
import { cellPatternAnchored } from "../match"
import { FUNCTION_KEYWORDS } from "../func"

// --- BUILDING BLOCKS ---
const op = fc.constantFrom("+", "-", "*", "/")
const parens = {
  open: fc.constant("("),
  close: fc.constant(")"),
}

// -- Numerics --
const nonZeroNat = fc
  .oneof(
    // fc.integer({ max: -1 }), // negative
    fc.integer({ min: 1 }), // positive
  )
  .map((n) => String(n))
const factorNumeric = nonZeroNat

// -- Cell refs and functions --
const cell = fc.stringMatching(cellPatternAnchored)
const _funcKeyword = fc.constantFrom(...FUNCTION_KEYWORDS)
// SUM, sum, SuM should be treated equally by the parser.
const _funcKeywordMixed = fc.mixedCase(_funcKeyword)
// Create a function expression such as sum(A0:Z99)
const func = fc
  .tuple(
    _funcKeywordMixed,
    parens.open,
    cell,
    fc.constant(":"),
    cell,
    parens.close,
  )
  .map((parts) => parts.join(""))

// -- Combinations --
// - Numeric -
const binaryNumeric = fc
  .tuple(factorNumeric, op, factorNumeric)
  .map((parts) => parts.join(""))
const parensNumeric = fc
  .tuple(parens.open, binaryNumeric, parens.close)
  .map((parts) => parts.join(""))
const anyNumeric = fc.oneof(factorNumeric, binaryNumeric, parensNumeric)

// - Cells and functions -
const anyCellOrFunc = fc.oneof(cell, func)
const binaryCellsOrFunc = fc
  .tuple(anyCellOrFunc, op, anyCellOrFunc)
  .map((parts) => parts.join(""))
const parensCellsAndFuncs = fc
  .tuple(parens.open, anyCellOrFunc, parens.close)
  .map((parts) => parts.join(""))
const anyAll = fc.oneof(
  anyNumeric,
  anyCellOrFunc,
  binaryCellsOrFunc,
  parensCellsAndFuncs,
)

// -- Generic building function --
function buildFormula(first: string, opPairs: Array<[string, string]>): string {
  return opPairs.reduce((expr, [op, nextExpr]) => expr + op + nextExpr, first)
}

// --- FORMULA FACTORIES ---
// -- Numeric --
// Generate random formulas containing the 4 ops and natural numbers.
// example OUTs: "1+2+3", "1/3+18-28736*9999"
export function createFormulaNumericNoBrackets() {
  return fc
    .tuple(
      // At least one number
      factorNumeric,
      // Plus 2-8 'links'
      fc.array(fc.tuple(op, factorNumeric), {
        minLength: 2,
        maxLength: 8,
      }),
    )
    .map(([first, pairs]) => buildFormula(first, pairs))
}

export function createFormulaNumericWithBrackets() {
  return fc
    .tuple(
      // Combine obligatory parens with more stuff
      parensNumeric,
      fc.array(fc.tuple(op, anyNumeric), {
        minLength: 2,
        maxLength: 8,
      }),
    )
    .map(([first, rest]) => buildFormula(first, rest))
}

// -- Cells --
// Like createFormulaNumericWithBrackets, but with single cell refs (no export functions)
export function createFormulaWithSingleCells() {
  // Start with obligatory cell ref
  return fc
    .tuple(
      cell,
      fc.array(fc.tuple(op, anyNumeric), {
        minLength: 2,
        maxLength: 8,
      }),
    )
    .map(([first, rest]) => buildFormula(first, rest))
}

// Like createFormulaWithSingleCells but also with functions
export function createFormulaWithFunctions() {
  // Start with obligatory function
  return fc
    .tuple(
      func,
      fc.array(fc.tuple(op, anyAll), {
        minLength: 2,
        maxLength: 8,
      }),
    )
    .map(([first, rest]) => buildFormula(first, rest))
}
