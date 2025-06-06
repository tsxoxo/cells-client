import * as fc from "fast-check"
import { it, expect } from "vitest"
import { interpret } from "../interpret"
import { parseToAST } from "../main"
import { assertIsSuccess } from "../types/errors"
import { createCell } from "../../INITIAL_DATA"
import { Cell } from "../../types"
import { getIndexFromCellName } from "../cellUtils"

const op = fc.constantFrom("+", "-", "*", "/")
const cellPattern = /[a-zA-Z]{1}[0-9]{1,2}/g

// Numeric formula, no brackets.
it("respects operator precedence", () => {
  fc.assert(
    fc.property(createFormulaNumericNoBrackets(), (expr) => {
      // Step 1: Make an AST
      const ast = parseToAST(expr)
      assertIsSuccess(ast)

      // Step 2: Evaluate formula
      const ourResult = interpret(ast.value, [])
      const jsResult = eval(expr)

      // Catches 0/0, 1/0, -1/0 == NaN, Infinity, -Infinity, respectively
      if (!isFinite(jsResult)) {
        expect(ourResult.ok).toBe(false) // Should be an error
      } else {
        // DEBUG
        // console.log("jsResult: ", jsResult)
        assertIsSuccess(ourResult)
        expect(ourResult.value.res).toEqual(jsResult)
      }
    }),
  )
})

// No cell refs, no nested brackets.
it("parses numeric expressions with brackets", () => {
  fc.assert(
    fc.property(createFormulaNumericWithBrackets(), (expr) => {
      // Make AST.
      const ast = parseToAST(expr)
      assertIsSuccess(ast)

      // Evaluate formula.
      const ourResult = interpret(ast.value, [])
      const jsResult = eval(expr)

      // Catches 0/0, 1/0, -1/0 == NaN, Infinity, -Infinity, respectively
      if (!isFinite(jsResult)) {
        expect(ourResult.ok).toBe(false) // Should be an error
      } else {
        assertIsSuccess(ourResult)
        expect(ourResult.value.res).toBeCloseTo(jsResult)
      }
    }),
  )
})

//############################################################
// CELLS
//############################################################
// Single cell refs, excluding func arguments like SUM(A1:A2)
it("processes single cell refs", () => {
  fc.assert(
    fc.property(createFormulaWithSingleCells(), (expr) => {
      // Filter out division by 0 -- we test for that separately.
      fc.pre(!expr.includes("/0"))

      // Create AST.
      const ast = parseToAST(expr)
      assertIsSuccess(ast)

      // Create cells array to pass to interpreter.
      const cells = createNumericSpreadsheet(26, 100)
      const ourResult = interpret(ast.value, cells)
      assertIsSuccess(ourResult)

      // HACK: extract cell values by hand.
      // i want to compare results, too.
      const formulaWithCellRefsResolved = replaceCellRefsWithValues(expr, cells)
      const jsResult = eval(formulaWithCellRefsResolved)

      expect(ourResult.value.res).toEqual(jsResult)
    }),
  )
})

it("tracks cell dependencies", () => {
  fc.assert(
    fc.property(createFormulaWithSingleCells(), (expr) => {
      fc.pre(!expr.includes("/0"))

      const ast = parseToAST(expr)
      assertIsSuccess(ast)

      const cells = createNumericSpreadsheet(26, 100)
      const ourResult = interpret(ast.value, cells)
      assertIsSuccess(ourResult)

      // deps is an array of cell indices
      const deps = ourResult.value.deps
      // Extract cell indices indices by hand
      const extractedCellIndices = expr
        .match(cellPattern)!
        .map((cellName) => getIndexFromCellName(cellName))

      expect(deps).toEqual(extractedCellIndices)
    }),
  )
})

// ############################################################
// HELPERS
// ############################################################
function createNumericSpreadsheet(x: number, y: number): Cell[] {
  return [...new Array(x * y)].map(() => {
    const randomNat = Math.floor(Math.random() * 9999)
    return createCell(randomNat)
  })
}

// Generate random formulae containing the 4 ops and natural numbers.
// example OUTs: "1+2+3", "0/3+18-28736"
function createFormulaNumericNoBrackets() {
  return fc
    .tuple(
      fc.nat(),
      fc.array(fc.tuple(op, fc.nat()), {
        minLength: 2,
        maxLength: 8,
      }),
    )
    .map(([first, pairs]) => {
      return String(first) + pairs.map(([op, num]) => op + String(num)).join("")
    })
}

function createFormulaNumericWithBrackets() {
  const arbSimpleExpr = fc.nat()
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

  return arbExpression
}

// Like createFormulaNumericWithBrackets, but with added cell refs (no functions)
function createFormulaWithSingleCells() {
  const num = fc.nat()
  const cell = fc.stringMatching(/^[a-zA-Z]{1}[0-9]{1,2}$/)

  const arbSimpleExpr = fc.oneof(num, cell)

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

  // add obligatory cell
  return fc.tuple(cell, op, arbExpression).map((t) => t.join(""))
}

// Fills in numeric values for cell refs
// IN: "A2+1"
// OUT: "99+1"
// (Gets A2's value from a given cells array)
function replaceCellRefsWithValues(formula: string, cells: Cell[]): string {
  let numericFormula = formula
  const matches = [...formula.matchAll(cellPattern)]

  // Loop through all cell refs matches (data type: regex iterable)
  // Start from the back to prevent index shifting.
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i]
    const cellName = match[0]
    const cellStartIndex = match.index // Returned array has additional 'index' property

    if (cellStartIndex === undefined) {
      throw new Error("cellStartIndex undefined in replaceCellRefsWithValues")
    }

    // Convert cellName to index in 1-dimensional array
    const cellIndex = getIndexFromCellName(cellName)
    // Get cell value
    const cellValue = cells[cellIndex].value

    if (typeof cellValue !== "number") {
      throw new Error("cellValue not a number in replaceCellRefsWithValues")
    }

    // Splice in value
    numericFormula =
      numericFormula.slice(0, cellStartIndex) +
      String(cellValue) +
      numericFormula.slice(cellStartIndex + cellName.length)
  }

  return numericFormula
}
