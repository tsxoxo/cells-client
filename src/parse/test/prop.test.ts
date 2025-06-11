//############################################################
// PROPERTY TESTS
//############################################################
// These tests automagically run with a slew of random values.
//
// NB: We leave out 0 from all formulas here, and test related edgecases (1/0, etc.) through examples.
//
import * as fc from "fast-check"
import { it, expect } from "vitest"
import { interpret } from "../interpret"
import { parseToAST } from "../main"
import { assertIsFail, assertIsSuccess } from "../types/errors"
import { createCell } from "../../INITIAL_DATA"
import { Cell } from "../../types"
import { getIndexFromCellName } from "../cellUtils"
import { NUM_OF_COLS, NUM_OF_ROWS } from "../../constants"

// TODO: test if these arbitraries generate different values on each prop test.
const op = fc.constantFrom("+", "-", "*", "/")
const cellPattern = /[a-zA-Z]{1}[0-9]{1,2}/g
const numNoZero = fc.oneof(
  // fc.integer({ max: -1 }), // negative
  fc.integer({ min: 1 }), // positive
)

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

      assertIsSuccess(ourResult)
      expect(ourResult.value.res).toEqual(jsResult)
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

      assertIsSuccess(ourResult)
      expect(ourResult.value.res).toBeCloseTo(jsResult)
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
      // Create AST.
      const ast = parseToAST(expr)
      assertIsSuccess(ast)

      // Create cells array to pass to interpreter.
      const cells = createNumericSpreadsheet()
      const ourResult = interpret(ast.value, cells)
      assertIsSuccess(ourResult)

      // HACK: extract cell values by hand, so that we can compare results, too.
      const formulaWithCellRefsResolved = replaceCellRefsWithValues(expr, cells)
      const jsResult = eval(formulaWithCellRefsResolved)

      expect(ourResult.value.res).toEqual(jsResult)
    }),
  )
})

it("tracks cell dependencies", () => {
  fc.assert(
    fc.property(createFormulaWithSingleCells(), (expr) => {
      const ast = parseToAST(expr)
      assertIsSuccess(ast)

      const cells = createNumericSpreadsheet()
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
// ERRORS
// ############################################################

// When cell is undefined, return error type: CELL_NOT_A_NUMBER
it("returns correct error when cell is undefined", () => {
  fc.assert(
    fc.property(createFormulaWithSingleCells(), (expr) => {
      // Create AST.
      const ast = parseToAST(expr)
      assertIsSuccess(ast)

      // Create cells array to pass to interpreter.
      const cells = createEmptySpreadsheet()
      const ourResult = interpret(ast.value, cells)
      assertIsFail(ourResult)

      expect(ourResult.error.type).toEqual("CELL_NOT_A_NUMBER")
      // Should throw on the first cell
      const cellsInFormula = expr.match(cellPattern)
      expect(ourResult.error.cell).toEqual(
        getIndexFromCellName(cellsInFormula![0]),
      )
    }),
  )
})

// When cell contains string, return error type: CELL_NOT_A_NUMBER
it("returns correct error when cell contains string", () => {
  fc.assert(
    fc.property(createFormulaWithSingleCells(), (expr) => {
      // Create AST.
      const ast = parseToAST(expr)
      assertIsSuccess(ast)

      // Create cells array to pass to interpreter.
      const cells = createStringSpreadsheet()
      const ourResult = interpret(ast.value, cells)
      assertIsFail(ourResult)

      expect(ourResult.error.type).toEqual("CELL_NOT_A_NUMBER")
      // Should throw on the first cell
      const cellsInFormula = expr.match(cellPattern)
      expect(ourResult.error.cell).toEqual(
        getIndexFromCellName(cellsInFormula![0]),
      )
    }),
  )
})
// ############################################################
// HELPERS
// ############################################################
//
// --- CELL ARRAY FACTORIES ---
function createNumericSpreadsheet(x = NUM_OF_COLS, y = NUM_OF_ROWS): Cell[] {
  return [...new Array(x * y)].map(() => {
    const randomNatNoZero = Math.floor(Math.random() * 9999) + 1
    return createCell(randomNatNoZero)
  })
}

function createEmptySpreadsheet(x = NUM_OF_COLS, y = NUM_OF_ROWS): Cell[] {
  return [...new Array(x * y)].map(() => {
    return createCell()
  })
}

function createStringSpreadsheet(x = NUM_OF_COLS, y = NUM_OF_ROWS): Cell[] {
  return [...new Array(x * y)].map(() => {
    return createCell(undefined, "foo")
  })
}

// --- FORMULA FACTORIES ---
// Generate random formulae containing the 4 ops and natural numbers.
// example OUTs: "1+2+3", "1/3+18-28736*9999"
function createFormulaNumericNoBrackets() {
  return fc
    .tuple(
      // At least one number
      numNoZero,
      // Plus 2-8 'links'
      fc.array(fc.tuple(op, numNoZero), {
        minLength: 2,
        maxLength: 8,
      }),
    )
    .map(([first, pairs]) => {
      return String(first) + pairs.map(([op, num]) => op + String(num)).join("")
    })
}

function createFormulaNumericWithBrackets() {
  const arbSimpleExpr = numNoZero
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

// --- CELLS ---
// Like createFormulaNumericWithBrackets, but with single cell refs (no functions)
function createFormulaWithSingleCells() {
  const num = numNoZero
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

    // Convert cellName to index
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
