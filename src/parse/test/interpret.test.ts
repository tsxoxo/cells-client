import { describe, expect, it } from "vitest"
import { interpret } from "../interpret"
import { assertIsFail, assertIsSuccess, success } from "../types/errors"
import { CellValueProvider, createCellValueProvider } from "../cellUtils"
import { Cell } from "../../types/types"
import { NUM_OF_COLS } from "../../config/constants"

// Test case ideas for interpret unit

// NOTE: for consistency, only use these values in tests:
// A0 for single cell refs containing non-zero value
// Z99 for single cell refs containing zero value
// A0:B1 for ranges
const mockCellValueProviderNonZero: CellValueProvider = {
  getCellValue: (name) =>
    name === "A0"
      ? success({ cellValue: 5, cellIndex: 0 })
      : success({ cellValue: 10, cellIndex: 1 }),
  getRangeValues: () =>
    success({
      cellValuesInRange: [5, 10, 15, 20],
      cellIndexesInRange: [0, 1, 2, 3],
    }),
}

const mockCellValueProviderZero: CellValueProvider = {
  getCellValue: (name) =>
    name === "A0"
      ? success({ cellValue: 0, cellIndex: 0 })
      : success({ cellValue: 10, cellIndex: 1 }), // sic! used for testing "1/(A1-A1)"
  getRangeValues: () =>
    success({
      cellValuesInRange: [0, 0, 0, 0],
      cellIndexesInRange: [0, 1, 2, 3],
    }),
}

describe("interpret", () => {
  describe("computes and collects deps from standard valid cases (no edge cases)", () => {
    it.each([
      {
        // formula: "11+31"
        description: "numeric expression",
        inputAST: {},
        expectedResult: {
          res: 42,
          deps: [],
        },
      },
      {
        // formula: "(11+31)"
        description: "bracketed numeric expression",
        inputAST: {},
        expectedResult: {
          res: 42,
          deps: [],
        },
      },
      {
        // formula: "11+A0"
        description: "cell expression",
        inputAST: {},
        expectedResult: {
          res: 42,
          deps: [0],
        },
      },
      {
        // formula: "11+SUM(A0:B1)"
        description: "function expression",
        inputAST: {},
        expectedResult: {
          res: 42,
          deps: [0, 1, 2, 3],
        },
      },
      {
        // formula: "combine all the above"
        description: "complex expression (should not duplicate deps)",
        inputAST: {},
        expectedResult: {
          res: 42,
          deps: [0, 1, 2, 3],
        },
      },
    ])("$description", ({ inputAST, expectedResult }) => {
      // TODO: mock cellValueProvider
      const result = interpret(inputAST, mockCellValueProviderNonZero)
      assertIsSuccess(result)
      expect(result.value).toEqual(expectedResult)
    })
  })

  // * trees with single nodes
  describe("edge cases", () => {
    it.each([
      {
        // formula: "1"
        description: "single numeric node",
        inputAST: {},
        expectedResult: {
          res: 1,
          deps: [],
        },
      },
      {
        // formula: "A0"
        description: "single cell node",
        inputAST: {},
        expectedResult: {
          res: 5,
          deps: [0],
        },
      },
      {
        // formula: "SUM(A0:B1)"
        description: "single function node",
        inputAST: {},
        expectedResult: {
          res: 42,
          deps: [0, 1, 2, 3],
        },
      },
    ])("$description", ({ inputAST, expectedResult }) => {
      const result = interpret(inputAST, mockCellValueProviderNonZero)
      assertIsSuccess(result)
      expect(result.value).toEqual(expectedResult)
    })
  })

  it("(smoke test) Works with the real cellValueProvider", () => {
    // Formula: "A0+A1"
    const cells: Cell[] = [] // fill in
    const cellValueProvider = createCellValueProvider(cells, NUM_OF_COLS)
    const ast = {}

    const result = interpret(ast, cellValueProvider)

    assertIsSuccess(result)
    expect(result.value).toBe({
      res: 42,
      deps: [0, 1],
    })
  })

  describe("Error Handling", () => {
    it.each([
      {
        // formula: "1/0"
        description: "divide by 0: numeric",
        inputAST: {},
        expectedErrorType: "DIVIDE_BY_0",
        expectedPayload: {}, // the 'right' node from inputAST
        expectedCellIndex: -1,
      },
      {
        // formula: "1/A0"
        description: "divide by 0: cell ref",
        inputAST: {},
        expectedErrorType: "DIVIDE_BY_0",
        expectedPayload: {}, // the 'right' node from inputAST
        expectedCellIndex: -1,
      },
      {
        // NOTE: use A1
        // formula: "1 / (A1-A1)"
        description: "divide by 0: 0 value resulting from substraction",
        inputAST: {},
        expectedErrorType: "DIVIDE_BY_0",
        expectedPayload: {}, // the 'right' node from inputAST
        expectedCellIndex: -1,
      },
      {
        // formula: "1 / SUM(A0:B1)"
        description: "divide by 0: 0 value resulting from range",
        inputAST: {},
        expectedErrorType: "DIVIDE_BY_0",
        expectedPayload: {}, // the 'right' node from inputAST
        expectedCellIndex: -1,
      },
    ])(
      "$description",
      ({ inputAST, expectedErrorType, expectedPayload, expectedCellIndex }) => {
        const result = interpret(inputAST, mockCellValueProviderZero)

        assertIsFail(result)
        expect(result.error.type).toBe(expectedErrorType)
        expect(result.error.payload).toBe(expectedPayload)
        if (expectedCellIndex > -1) {
          expect(result.error.cell).toEqual(expectedCellIndex)
        }
      },
    )
  })
})
