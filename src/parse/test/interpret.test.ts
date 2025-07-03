import { describe, expect, it } from "vitest"
import { interpret } from "../interpret"
import {
    InterpretErrorType,
    assertIsFail,
    assertIsSuccess,
    success,
} from "../types/errors"
import { CellValueProvider, createCellValueProvider } from "../cellUtils"
import { Cell } from "../../types/types"
import { NUM_OF_COLS } from "../../config/constants"
import { Node } from "../types/grammar"

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
            : success({ cellValue: 10, cellIndex: 1 }), // sic! used for testing "1/(B0-B0)"
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
                inputAST: {
                    type: "binary_op" as const,
                    value: "+",
                    position: { start: 2, end: 3 },
                    left: {
                        type: "number",
                        value: "11",
                        position: { start: 0, end: 2 },
                    },
                    right: {
                        type: "number",
                        value: "31",
                        position: { start: 3, end: 5 },
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
                    position: { start: 3, end: 4 },
                    left: {
                        type: "number",
                        value: "11",
                        position: { start: 1, end: 3 },
                    },
                    right: {
                        type: "number",
                        value: "31",
                        position: { start: 4, end: 6 },
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
                    position: { start: 2, end: 3 },
                    left: {
                        type: "number",
                        value: "11",
                        position: { start: 0, end: 2 },
                    },
                    right: {
                        type: "cell",
                        value: "A0",
                        position: { start: 3, end: 5 },
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
                    position: { start: 2, end: 3 },
                    left: {
                        type: "number",
                        value: "11",
                        position: { start: 0, end: 2 },
                    },
                    right: {
                        type: "func_range",
                        value: "sum",
                        position: { start: 3, end: 14 },
                        from: {
                            type: "cell",
                            value: "A0",
                            position: { start: 7, end: 9 },
                        },
                        to: {
                            type: "cell",
                            value: "B1",
                            position: { start: 10, end: 12 },
                        },
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
                    position: { start: 2, end: 3 },
                    left: {
                        type: "number",
                        value: "11",
                        position: { start: 0, end: 2 },
                    },
                    right: {
                        type: "binary_op" as const,
                        value: "*",
                        position: { start: 5, end: 6 },
                        left: {
                            type: "cell",
                            value: "A0",
                            position: { start: 3, end: 5 },
                        },
                        right: {
                            type: "func_range",
                            value: "sum",
                            position: { start: 6, end: 17 },
                            from: {
                                type: "cell",
                                value: "A0",
                                position: { start: 10, end: 12 },
                            },
                            to: {
                                type: "cell",
                                value: "B1",
                                position: { start: 13, end: 15 },
                            },
                        },
                    },
                } as Node,
                expectedResult: {
                    res: 261, // 11+A0*SUM(A0:B1) => 11 + 5 * (5+10+15+20) = 11 + 5*50 = 11+250 = 261
                    deps: [0, 1, 2, 3], // Should not contain duplicates
                },
            },
        ])("$description", ({ inputAST, expectedResult }) => {
            const result = interpret(inputAST, mockCellValueProvider)
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
                    position: { start: 0, end: 1 },
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
                    position: { start: 0, end: 2 },
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
                    position: { start: 0, end: 11 },
                    from: {
                        type: "cell",
                        value: "A0",
                        position: { start: 4, end: 6 },
                    },
                    to: {
                        type: "cell",
                        value: "B1",
                        position: { start: 7, end: 9 },
                    },
                } as Node,
                expectedResult: {
                    res: 50, // 5 + 10 + 15 + 20
                    deps: [0, 1, 2, 3],
                },
            },
        ])("$description", ({ inputAST, expectedResult }) => {
            const result = interpret(inputAST, mockCellValueProvider)
            assertIsSuccess(result)
            expect(result.value).toEqual(expectedResult)
        })
    })

    it("(smoke test) Works with the real cellValueProvider", () => {
        // Formula: "A0+B0"
        const cells: Cell[] = [
            { content: "5", value: 5, dependencies: [], dependents: [] },
            { content: "10", value: 10, dependencies: [], dependents: [] },
        ]
        const cellValueProvider = createCellValueProvider(cells, NUM_OF_COLS)
        const ast = {
            type: "binary_op",
            value: "+",
            position: { start: 2, end: 3 },
            left: {
                type: "cell",
                value: "A0",
                position: { start: 0, end: 2 },
            },
            right: {
                type: "cell",
                value: "B0",
                position: { start: 3, end: 5 },
            },
        } as Node

        const result = interpret(ast, cellValueProvider)

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
                    position: { start: 1, end: 2 },
                    left: {
                        type: "number",
                        value: "1",
                        position: { start: 0, end: 1 },
                    },
                    right: {
                        type: "number",
                        value: "0",
                        position: { start: 2, end: 3 },
                    },
                } as Node,
                expectedErrorType: "DIVIDE_BY_0" as InterpretErrorType,
                expectedPayload: {
                    type: "number",
                    value: "0",
                    position: { start: 2, end: 3 },
                } as Node, // the 'right' node from inputAST
            },
            {
                // formula: "1/A0"
                description: "divide by 0: cell ref",
                inputAST: {
                    type: "binary_op",
                    value: "/",
                    position: { start: 1, end: 2 },
                    left: {
                        type: "number",
                        value: "1",
                        position: { start: 0, end: 1 },
                    },
                    right: {
                        type: "cell",
                        value: "A0",
                        position: { start: 2, end: 4 },
                    },
                } as Node,
                expectedErrorType: "DIVIDE_BY_0" as InterpretErrorType,
                expectedPayload: {
                    type: "cell",
                    value: "A0",
                    position: { start: 2, end: 4 },
                } as Node, // the 'right' node from inputAST
            },
            {
                // NOTE: use B0
                // formula: "1/(B0-B0)"
                description: "divide by 0: 0 value resulting from substraction",
                inputAST: {
                    type: "binary_op",
                    value: "/",
                    position: { start: 1, end: 2 },
                    left: {
                        type: "number",
                        value: "1",
                        position: { start: 0, end: 1 },
                    },
                    right: {
                        type: "binary_op",
                        value: "-",
                        position: { start: 5, end: 6 },
                        left: {
                            type: "cell",
                            value: "B0",
                            position: { start: 3, end: 5 },
                        },
                        right: {
                            type: "cell",
                            value: "B0",
                            position: { start: 6, end: 8 },
                        },
                    },
                } as Node,
                expectedErrorType: "DIVIDE_BY_0" as InterpretErrorType,
                expectedPayload: {
                    type: "binary_op",
                    value: "-",
                    position: { start: 5, end: 6 },
                    left: {
                        type: "cell",
                        value: "B0",
                        position: { start: 3, end: 5 },
                    },
                    right: {
                        type: "cell",
                        value: "B0",
                        position: { start: 6, end: 8 },
                    },
                } as Node, // the 'right' node from inputAST
            },
            {
                // formula: "1/SUM(A0:B1)"
                description: "divide by 0: 0 value resulting from range",
                inputAST: {
                    type: "binary_op",
                    value: "/",
                    position: { start: 1, end: 2 },
                    left: {
                        type: "number",
                        value: "1",
                        position: { start: 0, end: 1 },
                    },
                    right: {
                        type: "func_range",
                        value: "sum",
                        position: { start: 2, end: 12 },
                        from: {
                            type: "cell",
                            value: "A0",
                            position: { start: 6, end: 8 },
                        },
                        to: {
                            type: "cell",
                            value: "B1",
                            position: { start: 9, end: 11 },
                        },
                    },
                } as Node,
                expectedErrorType: "DIVIDE_BY_0" as InterpretErrorType,
                expectedPayload: {
                    type: "func_range",
                    value: "sum",
                    position: { start: 2, end: 12 },
                    from: {
                        type: "cell",
                        value: "A0",
                        position: { start: 6, end: 8 },
                    },
                    to: {
                        type: "cell",
                        value: "B1",
                        position: { start: 9, end: 11 },
                    },
                } as Node, // the 'right' node from inputAST
            },
        ])(
            "$description",
            ({
                inputAST,
                expectedErrorType,
                expectedPayload,
                expectedCellIndex,
            }: {
                inputAST: Node
                expectedErrorType: InterpretErrorType
                expectedPayload: Node
                expectedCellIndex?: number
            }) => {
                const result = interpret(inputAST, mockCellValueProviderZero)

                assertIsFail(result)
                expect(result.error.type).toBe(expectedErrorType)
                expect(result.error.payload).toEqual(expectedPayload)
                if (expectedCellIndex !== undefined) {
                    expect(result.error.cellIndex).toEqual(expectedCellIndex)
                }
            },
        )
    })
})
