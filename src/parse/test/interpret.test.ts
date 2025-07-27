import { describe, expect, it } from "vitest"
import { interpret } from "../interpret"
import { assertIsFail, assertIsSuccess, success } from "../types/result"
import { InterpretErrorType } from "../types/errors"
import { CellValueProvider, createCellValueProvider } from "../utils/cells"
import { Cell } from "../../types/types"
import { NUM_OF_COLS } from "../../config/constants"
import { Node } from "../types/ast"

// Attempt at generic version
// function createMockCellValueProvider(
//   mockCells: Record<string, number>,
// ): CellValueProvider {
//   return {
//     getCellValue: (name: string) => {
//       return name in mockCells
//         ? success({
//             cellValue: mockCells[name],
//             cellIndex: getIndexFromCellName(name),
//           })
//         : fail({
//             type: "CELL_NOT_A_NUMBER",
//             cellIndex: getIndexFromCellName(name),
//           })
//     },
//
//     getRangeValues: (from: string, to: string) => {
//       return success({
//         cellValuesInRange: [...Object.values(mockCells)],
//         cellIndexesInRange: [...Object.keys(mockCells)],
//       })
//     },
//   }
// }

// NOTE: for consistency, only use these values in tests:
// A0 or B0 for single cell refs containing non-zero value
// A0:B1 for ranges
const mockCellValueProvider: CellValueProvider = {
    getCellValue: ([name]) =>
        name === "A0"
            ? success({ values: [5], indices: [0] })
            : success({ values: [10], indices: [1] }),
    getRangeValues: () =>
        success({
            values: [5, 10, 15, 20],
            indices: [0, 1, 2, 3],
        }),
}

const mockCellValueProviderZero: CellValueProvider = {
    getCellValue: ([name]) =>
        name === "A0"
            ? success({ values: [0], indices: [0] })
            : success({ values: [10], indices: [1] }), // sic! used for testing "1/(B0-B0)"
    getRangeValues: () =>
        success({
            values: [0, 0, 0, 0],
            indices: [0, 1, 2, 3],
        }),
}

describe("interpret", () => {
    describe("computes and collects deps from standard valid cases (no edge cases)", () => {
        it.each([
            {
                // formula: "11+31"
                description: "numeric expression",
                inputAST: {
                    type: "binary_op" as const,
                    value: "+",
                    start: 2,
                    left: {
                        type: "number",
                        value: "11",
                        start: 0,
                    },
                    right: {
                        type: "number",
                        value: "31",
                        start: 3,
                    },
                } as Node,
                expectedResult: {
                    res: 42,
                    deps: [],
                },
            },
            {
                // formula: "(11+31)"
                description: "bracketed numeric expression",
                inputAST: {
                    type: "binary_op" as const,
                    value: "+",
                    start: 3,
                    left: {
                        type: "number",
                        value: "11",
                        start: 1,
                    },
                    right: {
                        type: "number",
                        value: "31",
                        start: 4,
                    },
                } as Node,
                expectedResult: {
                    res: 42,
                    deps: [],
                },
            },
            {
                // formula: "11+A0"
                description: "cell expression",
                inputAST: {
                    type: "binary_op" as const,
                    value: "+",
                    start: 2,
                    left: {
                        type: "number",
                        value: "11",
                        start: 0,
                    },
                    right: {
                        type: "cell",
                        value: "A0",
                        start: 3,
                    },
                } as Node,
                expectedResult: {
                    res: 16, // 11 + 5
                    deps: [0],
                },
            },
            {
                // formula: "11+SUM(A0:B1)"
                description: "function expression",
                inputAST: {
                    type: "binary_op" as const,
                    value: "+",
                    start: 2,
                    left: {
                        type: "number",
                        value: "11",
                        start: 0,
                    },
                    right: {
                        type: "func_range",
                        value: "sum",
                        start: 3,
                        cells: [
                            {
                                type: "cell",
                                value: "A0",
                                start: 7,
                            },
                            {
                                type: "cell",
                                value: "B1",
                                start: 10,
                            },
                        ],
                    },
                } as Node,
                expectedResult: {
                    res: 61, // 11 + (5 + 10 + 15 + 20)
                    deps: [0, 1, 2, 3],
                },
            },
            {
                // formula: "11+A0*SUM(A0:B1)"
                description: "complex expression (should not duplicate deps)",
                inputAST: {
                    type: "binary_op" as const,
                    value: "+",
                    start: 2,
                    left: {
                        type: "number",
                        value: "11",
                        start: 0,
                    },
                    right: {
                        type: "binary_op" as const,
                        value: "*",
                        start: 5,
                        left: {
                            type: "cell",
                            value: "A0",
                            start: 3,
                        },
                        right: {
                            type: "func_range",
                            value: "sum",
                            start: 6,
                            cells: [
                                {
                                    type: "cell",
                                    value: "A0",
                                    start: 10,
                                },
                                {
                                    type: "cell",
                                    value: "B1",
                                    start: 13,
                                },
                            ],
                        },
                    },
                } as Node,
                expectedResult: {
                    res: 261, // 11+A0*SUM(A0:B1) => 11 + 5 * (5+10+15+20) = 11 + 5*50 = 11+250 = 261
                    deps: [0, 1, 2, 3], // Should not contain duplicates
                },
            },
        ])("$description", ({ inputAST, expectedResult }) => {
            const result = interpret(inputAST, mockCellValueProvider, -1)
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
                inputAST: {
                    type: "number",
                    value: "1",
                    start: 0,
                } as Node,
                expectedResult: {
                    res: 1,
                    deps: [],
                },
            },
            {
                // formula: "A0"
                description: "single cell node",
                inputAST: {
                    type: "cell",
                    value: "A0",
                    start: 0,
                } as Node,
                expectedResult: {
                    res: 5,
                    deps: [0],
                },
            },
            {
                // formula: "SUM(A0:B1)"
                description: "single function node",
                inputAST: {
                    type: "func_range",
                    value: "sum",
                    start: 0,
                    cells: [
                        {
                            type: "cell",
                            value: "A0",
                            start: 4,
                        },
                        {
                            type: "cell",
                            value: "B1",
                            start: 7,
                        },
                    ],
                } as Node,
                expectedResult: {
                    res: 50, // 5 + 10 + 15 + 20
                    deps: [0, 1, 2, 3],
                },
            },
        ])("$description", ({ inputAST, expectedResult }) => {
            const result = interpret(inputAST, mockCellValueProvider, -1)
            assertIsSuccess(result)
            expect(result.value).toEqual(expectedResult)
        })
    })

    it("(smoke test) Works with the real cellValueProvider", () => {
        // Formula: "A0+B0"
        const cells: Cell[] = [
            {
                content: "5",
                value: 5,
                dependencies: [],
                dependents: [],
                ownIndex: 0,
            },
            {
                content: "10",
                value: 10,
                dependencies: [],
                dependents: [],
                ownIndex: 1,
            },
        ]
        const cellValueProvider = createCellValueProvider(cells, NUM_OF_COLS)
        const ast = {
            type: "binary_op",
            value: "+",
            start: 2,
            left: {
                type: "cell",
                value: "A0",
                start: 0,
            },
            right: {
                type: "cell",
                value: "B0",
                start: 3,
            },
        } as Node

        const result = interpret(ast, cellValueProvider, -1)

        assertIsSuccess(result)
        expect(result.value).toEqual({
            res: 15, // 5 + 10
            deps: [0, 1],
        })
    })

    describe("Error Handling", () => {
        it.each([
            {
                // formula: "1/0"
                description: "divide by 0: numeric",
                inputAST: {
                    type: "binary_op",
                    value: "/",
                    start: 1,
                    left: {
                        type: "number",
                        value: "1",
                        start: 0,
                    },
                    right: {
                        type: "number",
                        value: "0",
                        start: 2,
                    },
                } as Node,
                expectedErrorType: "DIVIDE_BY_0" as InterpretErrorType,
                expectedErrorNode: {
                    type: "number",
                    value: "0",
                    start: 2,
                } as Node, // the 'right' node from inputAST
            },
            {
                // formula: "1/A0"
                description: "divide by 0: cell ref",
                inputAST: {
                    type: "binary_op",
                    value: "/",
                    start: 1,
                    left: {
                        type: "number",
                        value: "1",
                        start: 0,
                    },
                    right: {
                        type: "cell",
                        value: "A0",
                        start: 2,
                    },
                } as Node,
                expectedErrorType: "DIVIDE_BY_0" as InterpretErrorType,
                expectedErrorNode: {
                    type: "cell",
                    value: "A0",
                    start: 2,
                } as Node, // the 'right' node from inputAST
            },
            {
                // NOTE: use B0
                // formula: "1/(B0-B0)"
                description: "divide by 0: 0 value resulting from substraction",
                inputAST: {
                    type: "binary_op",
                    value: "/",
                    start: 1,
                    left: {
                        type: "number",
                        value: "1",
                        start: 0,
                    },
                    right: {
                        type: "binary_op",
                        value: "-",
                        start: 5,
                        left: {
                            type: "cell",
                            value: "B0",
                            start: 3,
                        },
                        right: {
                            type: "cell",
                            value: "B0",
                            start: 6,
                        },
                    },
                } as Node,
                expectedErrorType: "DIVIDE_BY_0" as InterpretErrorType,
                expectedErrorNode: {
                    type: "binary_op",
                    value: "-",
                    start: 5,
                    left: {
                        type: "cell",
                        value: "B0",
                        start: 3,
                    },
                    right: {
                        type: "cell",
                        value: "B0",
                        start: 6,
                    },
                } as Node, // the 'right' node from inputAST
            },
            {
                // formula: "1/SUM(A0:B1)"
                description: "divide by 0: 0 value resulting from range",
                inputAST: {
                    type: "binary_op",
                    value: "/",
                    start: 1,
                    left: {
                        type: "number",
                        value: "1",
                        start: 0,
                    },
                    right: {
                        type: "func_range",
                        value: "sum",
                        start: 2,
                        cells: [
                            {
                                type: "cell",
                                value: "A0",
                                start: 6,
                            },
                            {
                                type: "cell",
                                value: "B1",
                                start: 9,
                            },
                        ],
                    },
                } as Node,
                expectedErrorType: "DIVIDE_BY_0" as InterpretErrorType,
                expectedErrorNode: {
                    type: "func_range",
                    value: "sum",
                    start: 2,
                    cells: [
                        {
                            type: "cell",
                            value: "A0",
                            start: 6,
                        },
                        {
                            type: "cell",
                            value: "B1",
                            start: 9,
                        },
                    ],
                } as Node, // the 'right' node from inputAST
            },
        ])(
            "$description",
            ({
                inputAST,
                expectedErrorType,
                expectedErrorNode,
                expectedCellIndex,
            }: {
                inputAST: Node
                expectedErrorType: InterpretErrorType
                expectedErrorNode: Node
                expectedCellIndex?: number
            }) => {
                const result = interpret(
                    inputAST,
                    mockCellValueProviderZero,
                    -1,
                )

                assertIsFail(result)
                expect(result.error.type).toBe(expectedErrorType)
                expect(result.error.debugNode).toEqual(expectedErrorNode)
                if (expectedCellIndex !== undefined) {
                    expect(result.error.cellIndex).toEqual(expectedCellIndex)
                }
            },
        )
    })
})
