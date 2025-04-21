import { describe, expect, it } from "vitest"
import { interpret } from "../interpret"
import { Cell } from "../../types"
import { Node_Binary } from "../types/grammar"
import { assertIsFail, assertIsSuccess } from "../types/errors"

// =================================================
// # TEST DATA
// =================================================

// "2+3"
const validExpressionTree = {
  type: "binary_op",
  value: "+",
  left: { type: "number", value: "2" },
  right: { type: "number", value: "3" },
} as const

// "2*3"
const validTermTree = {
  type: "binary_op",
  value: "*",
  left: { type: "number", value: "2" },
  right: { type: "number", value: "3" },
} as const

// "1+2*3"
const validExpressionWithTermTree = {
  type: "binary_op",
  value: "+",
  left: { type: "number", value: "1" },
  right: {
    type: "binary_op",
    value: "*",
    left: { type: "number", value: "2" },
    right: { type: "number", value: "3" },
  },
} as const

// "A0*a01"
const validWithCells = {
  type: "binary_op",
  value: "+",
  left: { type: "cell", value: "A0" },
  right: { type: "cell", value: "a01" },
} as const

const cellsA0andA1: Cell[] = [
  {
    content: "0",
    value: 0,
    dependencies: [],
    dependents: [],
  },
  {
    content: "1",
    value: 1,
    dependencies: [],
    dependents: [],
  },
]

// "(1+2)*3"
const validFromParens: Node_Binary = {
  type: "binary_op",
  value: "*",
  left: {
    type: "binary_op",
    value: "+",
    left: { type: "number", value: "1" },
    right: { type: "number", value: "2" },
  },
  right: { type: "number", value: "3" },
} as const

// With functions
// "SUM(A1:A5)*3"
const validWithFunc: Node_Binary = {
  type: "binary_op",
  value: "*",
  left: { type: "func", value: "sum", from: "A1", to: "A5" },
  right: {
    type: "number",
    value: "3",
  },
} as const

// INVALID
//
// * [INVALID_CELL] Invalid value from cell reference: "A1 + A2", where A1 === 'something invalid'
//const invalid
// * [DIVIDE_BY_0] Divide by 0
const divideByZero = {
  type: "binary_op",
  value: "/",
  left: { type: "number", value: "1" },
  right: { type: "number", value: "0" },
} as const

// =================================================
// # TEST
// =================================================
describe("Interpreter", () => {
  it("does number arithmetics no brackets", () => {
    let result = interpret(validExpressionTree, [])
    assertIsSuccess(result)
    expect(result.value.formulaResult).toEqual(5)

    result = interpret(validTermTree, [])
    assertIsSuccess(result)
    expect(result.value.formulaResult).toEqual(6)

    result = interpret(validExpressionWithTermTree, [])
    assertIsSuccess(result)
    expect(result.value.formulaResult).toEqual(7)
  })

  it("uses values from cells and extracts dependencies", () => {
    const result = interpret(validWithCells, cellsA0andA1)
    assertIsSuccess(result)
    expect(result.value.formulaResult).toEqual(1)
    expect(result.value.deps).toEqual([0, 1])
  })

  it("parses tree derived from expr containing parens", () => {
    const result = interpret(validFromParens, [])
    assertIsSuccess(result)
    expect(result.value.formulaResult).toEqual(9)
    expect(result.value.deps).toEqual([])
  })

  it("interprets functions with ranges", () => {
    const mockCells = [
      { value: 10 }, // A0
      { value: 20 },
      { value: 30 },
      { value: 15 },
      { value: 25 },
      { value: 35 }, // A5
    ] as Cell[]

    // "SUM(A1:A5)*3"
    // SUM(A1:A5) = 20 + 30 + 15 + 25 + 35 = 125
    // result = 125 * 3 = 375
    const result = interpret(validWithFunc, mockCells)
    assertIsSuccess(result)
    expect(result.value.formulaResult).toEqual(375)
    expect(result.value.deps).toEqual([1, 2, 3, 4, 5])
  })

  // INVALID CASES
  it("handles divide by zero", () => {
    const result = interpret(divideByZero, [])
    assertIsFail(result)
    expect(result.error.type).toEqual("DIVIDE_BY_0")
  })
})
