import * as fc from "fast-check"
import { it, expect } from "vitest"
import { interpret } from "../interpret"
import { parseToAST } from "../main"
import { assertIsSuccess, isSuccess } from "../types/errors"
import { createCell } from "../../INITIAL_DATA"
import { Cell } from "../../types"
import { getIndexFromCellName } from "../cellUtils"

const op = fc.constantFrom("+", "-", "*", "/")

function createNumericSpreadsheet(x: number, y: number): Cell[] {
  return [...new Array(x * y)].map(() => {
    const randomNat = Math.floor(Math.random() * 9999)
    return createCell(randomNat)
  })
}

function arbMathExprWithCells() {
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

// idea: Have a cells mock containing 50% numeric, and 50% non-numeric/undefined
it("handles cells in any position", () => {
  fc.assert(
    fc.property(arbMathExprWithCells(), (expr) => {
      fc.pre(!expr.includes("/0"))

      const ast = parseToAST(expr)
      assertIsSuccess(ast)

      const cells = createNumericSpreadsheet(26, 100)
      const ourResult = interpret(ast.value, cells)
      assertIsSuccess(ourResult)
    }),
  )
})

it("tracks cell dependencies", () => {
  fc.assert(
    fc.property(arbMathExprWithCells(), (expr) => {
      fc.pre(!expr.includes("/0"))

      const ast = parseToAST(expr)
      assertIsSuccess(ast)

      const cells = createNumericSpreadsheet(26, 100)
      const ourResult = interpret(ast.value, cells)
      assertIsSuccess(ourResult)

      const deps = ourResult.value.deps

      const extractedCells = expr
        .match(/[a-zA-Z]{1}[0-9]{1,2}/g)!
        .map((cellName) => getIndexFromCellName(cellName))

      expect(deps).toEqual(extractedCells)
    }),
  )
})

function arbMathExpr2() {
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
//
it("parses numeric expressions with brackets", () => {
  fc.assert(
    fc.property(arbMathExpr2(), (expr) => {
      // fc.pre(!expr.includes("/0"))

      const ast = parseToAST(expr)
      assertIsSuccess(ast)

      const ourResult = interpret(ast.value, [])

      const jsResult = eval(expr)

      if (!isFinite(jsResult)) {
        expect(ourResult.ok).toBe(false) // Should be an error
      } else {
        assertIsSuccess(ourResult)
        expect(ourResult.value.res).toBeCloseTo(jsResult)
      }
    }),
  )
})

// Generate random formulae containing the 4 ops and natural numbers.
// example OUTs: "1+2+3", "0/3+18-28736"
function arbMathExpr() {
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

it("respects operator precedence", () => {
  fc.assert(
    fc.property(arbMathExpr(), (expr) => {
      // fc.pre(!expr.includes("/0"))

      const ast = parseToAST(expr)
      expect(isSuccess(ast)).toBe(true)
      assertIsSuccess(ast)

      const ourResult = interpret(ast.value, [])

      const jsResult = eval(expr)

      if (!isFinite(jsResult)) {
        expect(ourResult.ok).toBe(false) // Should be an error
      } else {
        // DEBUG
        // console.log("jsResult: ", jsResult)
        assertIsSuccess(ourResult)
        expect(ourResult.value.res).toBeCloseTo(jsResult)
      }
      // expect(ourResult.value.res).toEqual(JSResult)
    }),
  )
})
