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

// "A0*B00"
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
    expect(result.value.res).toEqual(0)
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

  const result = interpret(sumWithBadCell, mockCells, 2)

  assertIsFail(result)
  expect(result.error.type).toBe("CELL_NOT_A_NUMBER")
  expect(result.error.cell).toBe(3) // B1's index
  expect(result.error.node.position).toEqual({ start: 0, end: 10 }) // To mark the range string "A0:B1"
  expect(result.error.range).toBe("A0:B1") // The literal range
  expect(result.error.node).toEqual(sumWithBadCell) // The node that failed
})

it("catches error CELL_UNDEFINED", () => {
  // "A1"
  const undefinedCellTree = {
    type: "cell",
    value: "A1",
    position: { start: 0, end: 2 },
  } as const

  // Mock cells array with only 26 elements (A0-Z0), so A1 (index 26) is undefined
  const mockCells: Cell[] = Array(26).fill({
    content: "0",
    value: 0,
    dependencies: [],
    dependents: [],
  })

  const result = interpret(undefinedCellTree, mockCells)
  assertIsFail(result)
  expect(result.error.type).toBe("CELL_UNDEFINED")
  expect(result.error.node).toEqual(undefinedCellTree)
})

it("catches error CIRCULAR_CELL_REF", () => {
  // Test A: Direct self-reference "A1"
  const selfRefTree = {
    type: "cell",
    value: "A1",
    position: { start: 0, end: 2 },
  } as const

  const mockCells: Cell[] = Array(30).fill({
    content: "0",
    value: 0,
    dependencies: [],
    dependents: [],
  })

  const directResult = interpret(selfRefTree, mockCells, 26, 26) // A1 is index 26
  assertIsFail(directResult)
  expect(directResult.error.type).toBe("CIRCULAR_CELL_REF")

  // Test B: Self-reference in range "SUM(A0:B1)"
  const rangeWithSelfTree = {
    type: "func",
    value: "sum",
    position: { start: 0, end: 10 },
    from: { type: "cell", value: "A0", position: { start: 4, end: 6 } },
    to: { type: "cell", value: "B1", position: { start: 7, end: 9 } },
  } as const

  const rangeResult = interpret(rangeWithSelfTree, mockCells, 26, 26) // A1 is in range A0:B1
  assertIsFail(rangeResult)
  expect(rangeResult.error.type).toBe("CIRCULAR_CELL_REF")
})
