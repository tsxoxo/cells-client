import { describe, expect, it } from "vitest"
import { interpret } from "../interpret"
import { Cell } from "../../types"
import { Node_Binary, Node_Func } from "../types/grammar"
import { assertIsFail, assertIsSuccess } from "../types/errors"

// =================================================
// # TEST DATA
// =================================================

// "2+3"
const validExpressionTree = {
  type: "binary_op",
  value: "+",
  position: { start: 0, end: 3 },
  left: { type: "number", value: "2", position: { start: 0, end: 1 } },
  right: { type: "number", value: "3", position: { start: 2, end: 3 } },
} as const

// "2*3"
const validTermTree = {
  type: "binary_op",
  value: "*",
  position: { start: 0, end: 3 },
  left: { type: "number", value: "2", position: { start: 0, end: 1 } },
  right: { type: "number", value: "3", position: { start: 2, end: 3 } },
} as const

// "1+2*3"
const validExpressionWithTermTree = {
  type: "binary_op",
  value: "+",
  position: { start: 0, end: 5 },
  left: { type: "number", value: "1", position: { start: 0, end: 1 } },
  right: {
    type: "binary_op",
    value: "*",
    position: { start: 2, end: 5 },
    left: { type: "number", value: "2", position: { start: 2, end: 3 } },
    right: { type: "number", value: "3", position: { start: 4, end: 5 } },
  },
} as const

// "A0*B00" (fixed operator to match comment)
const validWithCells = {
  type: "binary_op",
  value: "*",
  position: { start: 0, end: 6 },
  left: { type: "cell", value: "A0", position: { start: 0, end: 2 } },
  right: { type: "cell", value: "B00", position: { start: 3, end: 6 } },
} as const

const cellsA0andB0: Cell[] = [
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
  position: { start: 0, end: 7 },
  left: {
    type: "binary_op",
    value: "+",
    position: { start: 1, end: 4 },
    left: { type: "number", value: "1", position: { start: 1, end: 2 } },
    right: { type: "number", value: "2", position: { start: 3, end: 4 } },
  },
  right: { type: "number", value: "3", position: { start: 6, end: 7 } },
} as const

// With functions
// "SUM(A0:F0)*3"
const validWithFunc: Node_Binary = {
  type: "binary_op",
  value: "*",
  position: { start: 0, end: 12 },
  left: {
    type: "func",
    value: "sum",
    position: { start: 0, end: 10 },
    from: { type: "cell", value: "A0", position: { start: 4, end: 6 } },
    to: { type: "cell", value: "F0", position: { start: 7, end: 9 } },
  },
  right: {
    type: "number",
    value: "3",
    position: { start: 11, end: 12 },
  },
} as const

// INVALID
//
// * [CELL_NOT_A_NUMBER] Invalid value from cell reference: "A1 + A2", where A1 === 'something invalid'
//const invalid
// * [DIVIDE_BY_0] Divide by 0
const divideByZero = {
  type: "binary_op",
  value: "/",
  position: { start: 0, end: 3 },
  left: { type: "number", value: "1", position: { start: 0, end: 1 } },
  right: { type: "number", value: "0", position: { start: 2, end: 3 } },
} as const

// =================================================
// # TEST
// =================================================
describe("Interpreter", () => {
  it("does number arithmetics no brackets", () => {
    let result = interpret(validExpressionTree, [])
    assertIsSuccess(result)
    // 'result.value.res': yes, this is stupid
    expect(result.value.res).toEqual(5)

    result = interpret(validTermTree, [])
    assertIsSuccess(result)
    expect(result.value.res).toEqual(6)

    result = interpret(validExpressionWithTermTree, [])
    assertIsSuccess(result)
    expect(result.value.res).toEqual(7)
  })

  it("uses values from cells and extracts dependencies", () => {
    const result = interpret(validWithCells, cellsA0andB0)
    assertIsSuccess(result)
    expect(result.value.res).toEqual(1)
    expect(result.value.deps).toEqual([0, 1])
  })

  it("parses tree derived from expr containing parens", () => {
    const result = interpret(validFromParens, [])
    assertIsSuccess(result)
    expect(result.value.res).toEqual(9)
    expect(result.value.deps).toEqual([])
  })

  it("interprets functions with ranges", () => {
    const mockCells = [
      { value: 10 }, // A0
      { value: 20 },
      { value: 30 },
      { value: 15 },
      { value: 25 },
      { value: 35 }, // F0
    ] as Cell[]

    // "SUM(A0:F0)*3"
    // SUM(A0:F0) = 10 + 20 + 30 + 15 + 25 + 35 = 135
    // result = 135 * 3 = 405
    const result = interpret(validWithFunc, mockCells)
    assertIsSuccess(result)
    expect(result.value.res).toEqual(405)
    expect(result.value.deps).toEqual([0, 1, 2, 3, 4, 5])
  })

  // INVALID CASES
  it("handles divide by zero", () => {
    const result = interpret(divideByZero, [])
    assertIsFail(result)
    expect(result.error.type).toEqual("DIVIDE_BY_0")
  })
})

it("produces correct error CELL_NOT_A_NUMBER", () => {
  // "SUM(A0:B1)"
  const sumWithBadCell: Node_Func = {
    type: "func",
    value: "sum",
    position: { start: 0, end: 10 },
    from: { type: "cell", value: "A0", position: { start: 4, end: 6 } },
    to: { type: "cell", value: "B1", position: { start: 7, end: 9 } },
  }

  const mockCells: Cell[] = [
    { content: "10", value: 10, dependencies: [], dependents: [] }, // A0
    { content: "20", value: 20, dependencies: [], dependents: [] }, // A1
    { content: "30", value: 30, dependencies: [], dependents: [] }, // B0
    { content: "foo", value: undefined, dependencies: [], dependents: [] }, // B1 - non-numeric!
  ]

  const result = interpret(sumWithBadCell, mockCells)

  assertIsFail(result)
  expect(result.error.type).toBe("CELL_NOT_A_NUMBER")
  expect(result.error.cell).toBe(3) // B1's index
  expect(result.error.position).toEqual({ start: 7, end: 9 }) // To mark the range string "A0:B1"
  expect(result.error.range).toBe("A0:B1") // The literal range
  expect(result.error.node).toEqual(sumWithBadCell) // The node that failed
})
