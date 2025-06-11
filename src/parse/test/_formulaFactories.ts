import * as fc from "fast-check"
import { cellPatternAnchored } from "../match"

// --- BASE ELEMENTS ---
const op = fc.constantFrom("+", "-", "*", "/")
const nonZeroNat = fc
  .oneof(
    // fc.integer({ max: -1 }), // negative
    fc.integer({ min: 1 }), // positive
  )
  .map((n) => String(n))

// --- FORMULA FACTORIES ---
function buildFormula(first: string, opPairs: Array<[string, string]>): string {
  return opPairs.reduce((expr, [op, nextExpr]) => expr + op + nextExpr, first)
}

// Generate random formulae containing the 4 ops and natural numbers.
// example OUTs: "1+2+3", "1/3+18-28736*9999"
export function createFormulaNumericNoBrackets() {
  return fc
    .tuple(
      // At least one number
      nonZeroNat,
      // Plus 2-8 'links'
      fc.array(fc.tuple(op, nonZeroNat), {
        minLength: 2,
        maxLength: 8,
      }),
    )
    .map(([first, pairs]) => buildFormula(first, pairs))
}

export function createFormulaNumericWithBrackets() {
  const arbSimpleExpr = nonZeroNat
  const arbBinaryExpr = fc
    .tuple(arbSimpleExpr, op, arbSimpleExpr)
    .map((parts) => parts.join(""))

  const arbParenExpr = fc
    .tuple(fc.constant("("), arbBinaryExpr, fc.constant(")"))
    .map((parts) => parts.join(""))

  // Combine with frequency
  const arbExpression = fc.oneof(
    { weight: 3, arbitrary: arbSimpleExpr.map((n) => String(n)) },
    { weight: 2, arbitrary: arbBinaryExpr },
    { weight: 1, arbitrary: arbParenExpr },
  )

  const exprChain = fc
    .tuple(
      arbExpression,
      fc.array(fc.tuple(op, arbExpression), {
        minLength: 2,
        maxLength: 8,
      }),
    )
    .map(([first, rest]) => buildFormula(first, rest))

  return exprChain
}

// --- CELLS ---
// Like createFormulaNumericWithBrackets, but with single cell refs (no export functions)
export function createFormulaWithSingleCells() {
  const num = nonZeroNat
  const cell = fc.stringMatching(cellPatternAnchored)

  const arbSimpleExpr = fc.oneof(num, cell)

  const arbBinaryExpr = fc
    .tuple(arbSimpleExpr, op, arbSimpleExpr)
    .map((parts) => parts.join(""))

  const arbParenExpr = fc
    .tuple(fc.constant("("), arbBinaryExpr, fc.constant(")"))
    .map((parts) => parts.join(""))

  // Combine with frequency
  const arbExpression = fc.oneof(
    { weight: 3, arbitrary: arbSimpleExpr },
    { weight: 2, arbitrary: arbBinaryExpr },
    { weight: 1, arbitrary: arbParenExpr },
  )

  // Start with obligatory cell ref
  const exprChain = fc
    .tuple(
      cell,
      fc.array(fc.tuple(op, arbExpression), {
        minLength: 2,
        maxLength: 8,
      }),
    )
    .map(([first, rest]) => buildFormula(first, rest))

  return exprChain
}
