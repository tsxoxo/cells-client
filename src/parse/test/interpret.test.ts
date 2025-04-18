import { assert, describe, expect, it } from "vitest"
import { interpret } from "../interpret"
import { Cell } from "../../types"

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
const validFromParens = {
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
    assert(result.ok === true)
    expect(result.value.formulaResult).toEqual(5)

    result = interpret(validTermTree, [])
    assert(result.ok === true)
    expect(result.value.formulaResult).toEqual(6)

    result = interpret(validExpressionWithTermTree, [])
    assert(result.ok === true)
    expect(result.value.formulaResult).toEqual(7)
  })

  it("uses values from cells and extracts dependencies", () => {
    const result = interpret(validWithCells, cellsA0andA1)
    assert(result.ok === true)
    expect(result.value.formulaResult).toEqual(1)
    expect(result.value.deps).toEqual([0, 1])
  })

  it("parses tree derived from expr containing parens", () => {
    const result = interpret(validFromParens, [])
    assert(result.ok === true)
    expect(result.value.formulaResult).toEqual(9)
    expect(result.value.deps).toEqual([])
  })

  // INVALID CASES
  it("handles divide by zero", () => {
    const result = interpret(divideByZero, [])
    assert(result.ok === false)
    expect(result.error.type).toEqual("DIVIDE_BY_0")
  })
})
