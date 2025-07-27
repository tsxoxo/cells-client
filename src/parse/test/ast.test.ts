// =================================================
// EXAMPLE-BASED UNIT TESTS FOR THE AST MODULE
// =================================================
import { describe, expect, it } from "vitest"
import { Parser } from "../ast"
import { Token, TokenType } from "../types/token"
import { assertIsFail, assertIsSuccess } from "../types/result"

// =================================================
// ==================== UTILS ======================
// =================================================
// Token factory.
function makeTokens(
    tokenArray: {
        type: TokenType
        value: string
        start: number
    }[],
): Token[] {
    // Vestige of a time when we were using dummy values.
    // Not worth refactoring.
    // const tokens = tokenArray.map(
    //     ({ type, value, start }): Token => ({
    //         type,
    //         value,
    //         start,
    //     }),
    // )

    return tokenArray
}

// =================================================
// ===================== TEST ======================
// =================================================
describe("ast", () => {
    describe("standard valid cases (no edge-cases)", () => {
        it.each([
            {
                description: "parenthesized addition",
                // formula: "(1+2)"
                inputTokens: makeTokens([
                    { type: "parens_open", value: "(", start: 0 },
                    { type: "number", value: "1", start: 1 },
                    { type: "op", value: "+", start: 2 },
                    { type: "number", value: "2", start: 3 },
                    { type: "parens_close", value: ")", start: 4 },
                ]),
                expectedAST: {
                    type: "binary_op",
                    value: "+",
                    start: 0,
                    left: {
                        type: "number",
                        value: "1",
                        start: 1,
                    },
                    right: {
                        type: "number",
                        value: "2",
                        start: 3,
                    },
                },
            },
            {
                description: "function with range",
                // formula: "SUM(A1:B2)"
                inputTokens: makeTokens([
                    { type: "func", value: "SUM", start: 0 },
                    { type: "parens_open", value: "(", start: 3 },
                    { type: "cell", value: "A1", start: 4 },
                    { type: "op_range", value: ":", start: 6 },
                    { type: "cell", value: "B2", start: 7 },
                    { type: "parens_close", value: ")", start: 9 },
                ]),
                expectedAST: {
                    type: "func_range",
                    value: "sum",
                    start: 0,
                    cells: [
                        {
                            type: "cell",
                            value: "A1",
                            start: 4,
                        },
                        {
                            type: "cell",
                            value: "B2",
                            start: 7,
                        },
                    ],
                },
            },
            {
                description: "simple division",
                // formula: "6/3"
                inputTokens: makeTokens([
                    { type: "number", value: "6", start: 0 },
                    { type: "op", value: "/", start: 1 },
                    { type: "number", value: "3", start: 2 },
                ]),
                expectedAST: {
                    type: "binary_op",
                    value: "/",
                    start: 0,
                    left: {
                        type: "number",
                        value: "6",
                        start: 0,
                    },
                    right: {
                        type: "number",
                        value: "3",
                        start: 2,
                    },
                },
            },
            {
                description: "parenthesized expression with multiplication",
                // formula: "(1+2)*3"
                inputTokens: makeTokens([
                    { type: "parens_open", value: "(", start: 0 },
                    { type: "number", value: "1", start: 1 },
                    { type: "op", value: "+", start: 2 },
                    { type: "number", value: "2", start: 3 },
                    { type: "parens_close", value: ")", start: 4 },
                    { type: "op", value: "*", start: 5 },
                    { type: "number", value: "3", start: 6 },
                ]),
                expectedAST: {
                    type: "binary_op",
                    value: "*",
                    start: 0,
                    left: {
                        type: "binary_op",
                        value: "+",
                        start: 0,
                        left: {
                            type: "number",
                            value: "1",
                            start: 1,
                        },
                        right: {
                            type: "number",
                            value: "2",
                            start: 3,
                        },
                    },
                    right: {
                        type: "number",
                        value: "3",
                        start: 6,
                    },
                },
            },
            {
                description: "function with division",
                // formula: "SUM(A1:B2)/3"
                inputTokens: makeTokens([
                    { type: "func", value: "SUM", start: 0 },
                    { type: "parens_open", value: "(", start: 3 },
                    { type: "cell", value: "A1", start: 4 },
                    { type: "op_range", value: ":", start: 6 },
                    { type: "cell", value: "B2", start: 7 },
                    { type: "parens_close", value: ")", start: 9 },
                    { type: "op", value: "/", start: 10 },
                    { type: "number", value: "3", start: 11 },
                ]),
                expectedAST: {
                    type: "binary_op",
                    value: "/",
                    start: 0,
                    left: {
                        type: "func_range",
                        value: "sum",
                        start: 0,
                        cells: [
                            {
                                type: "cell",
                                value: "A1",
                                start: 4,
                            },
                            {
                                type: "cell",
                                value: "B2",
                                start: 7,
                            },
                        ],
                    },
                    right: {
                        type: "number",
                        value: "3",
                        start: 11,
                    },
                },
            },
            {
                description: "complete formula with all operations",
                // formula: "(1+2)*SUM(A1:B2)/3"
                inputTokens: makeTokens([
                    { type: "parens_open", value: "(", start: 0 },
                    { type: "number", value: "1", start: 1 },
                    { type: "op", value: "+", start: 2 },
                    { type: "number", value: "2", start: 3 },
                    { type: "parens_close", value: ")", start: 4 },
                    { type: "op", value: "*", start: 5 },
                    { type: "func", value: "SUM", start: 6 },
                    { type: "parens_open", value: "(", start: 9 },
                    { type: "cell", value: "A1", start: 10 },
                    { type: "op_range", value: ":", start: 12 },
                    { type: "cell", value: "B2", start: 13 },
                    { type: "parens_close", value: ")", start: 15 },
                    { type: "op", value: "/", start: 16 },
                    { type: "number", value: "3", start: 17 },
                ]),
                expectedAST: {
                    type: "binary_op",
                    value: "/",
                    start: 0,
                    left: {
                        type: "binary_op",
                        value: "*",
                        start: 0,
                        left: {
                            type: "binary_op",
                            value: "+",
                            start: 0,
                            left: {
                                type: "number",
                                value: "1",
                                start: 1,
                            },
                            right: {
                                type: "number",
                                value: "2",
                                start: 3,
                            },
                        },
                        right: {
                            type: "func_range",
                            value: "sum",
                            start: 6,
                            cells: [
                                {
                                    type: "cell",
                                    value: "A1",
                                    start: 10,
                                },
                                {
                                    type: "cell",
                                    value: "B2",
                                    start: 13,
                                },
                            ],
                        },
                    },
                    right: {
                        type: "number",
                        value: "3",
                        start: 17,
                    },
                },
            },
        ])("$description", ({ inputTokens, expectedAST }) => {
            const parser = new Parser(inputTokens)
            const result = parser.makeAST()
            assertIsSuccess(result)
            expect(result.value).toEqual(expectedAST)
        })
    })
    describe("edge cases", () => {
        it.each([
            {
                description: "single number",
                // formula: "42"
                inputTokens: makeTokens([
                    { type: "number", value: "42", start: 0 },
                ]),
                expectedAST: {
                    type: "number",
                    value: "42",
                    start: 0,
                },
            },
            {
                description: "single cell reference",
                // formula: "A99"
                inputTokens: makeTokens([
                    { type: "cell", value: "A99", start: 0 },
                ]),
                expectedAST: {
                    type: "cell",
                    value: "A99",
                    start: 0,
                },
            },
            {
                description: "single function",
                // formula: "SUM(A1:A9)"
                inputTokens: makeTokens([
                    { type: "func", value: "SUM", start: 0 },
                    { type: "parens_open", value: "(", start: 3 },
                    { type: "cell", value: "A1", start: 4 },
                    { type: "op_range", value: ":", start: 6 },
                    { type: "cell", value: "A9", start: 7 },
                    { type: "parens_close", value: ")", start: 9 },
                ]),
                expectedAST: {
                    type: "func_range",
                    value: "sum",
                    start: 0,
                    cells: [
                        {
                            type: "cell",
                            value: "A1",
                            start: 4,
                        },
                        {
                            type: "cell",
                            value: "A9",
                            start: 7,
                        },
                    ],
                },
            },
            {
                description: "nested expression",
                // formula: "1*(10/(1-(2*6))+7)"
                inputTokens: makeTokens([
                    { type: "number", value: "1", start: 0 },
                    { type: "op", value: "*", start: 1 },
                    { type: "parens_open", value: "(", start: 2 },
                    { type: "number", value: "10", start: 3 },
                    { type: "op", value: "/", start: 5 },
                    { type: "parens_open", value: "(", start: 6 },
                    { type: "number", value: "1", start: 7 },
                    { type: "op", value: "-", start: 8 },
                    { type: "parens_open", value: "(", start: 9 },
                    { type: "number", value: "2", start: 10 },
                    { type: "op", value: "*", start: 11 },
                    { type: "number", value: "6", start: 12 },
                    { type: "parens_close", value: ")", start: 13 },
                    { type: "parens_close", value: ")", start: 14 },
                    { type: "op", value: "+", start: 15 },
                    { type: "number", value: "7", start: 16 },
                    { type: "parens_close", value: ")", start: 17 },
                ]),
                expectedAST: {
                    type: "binary_op",
                    value: "*",
                    start: 0,
                    left: {
                        type: "number",
                        value: "1",
                        start: 0,
                    },
                    right: {
                        type: "binary_op",
                        value: "+",
                        start: 2,
                        left: {
                            type: "binary_op",
                            value: "/",
                            start: 3,
                            left: {
                                type: "number",
                                value: "10",
                                start: 3,
                            },
                            right: {
                                type: "binary_op",
                                value: "-",
                                start: 6,
                                left: {
                                    type: "number",
                                    value: "1",
                                    start: 7,
                                },
                                right: {
                                    type: "binary_op",
                                    value: "*",
                                    start: 9,
                                    left: {
                                        type: "number",
                                        value: "2",
                                        start: 10,
                                    },
                                    right: {
                                        type: "number",
                                        value: "6",
                                        start: 12,
                                    },
                                },
                            },
                        },
                        right: {
                            type: "number",
                            value: "7",
                            start: 16,
                        },
                    },
                },
            },
        ])("$description", ({ inputTokens, expectedAST }) => {
            const parser = new Parser(inputTokens)
            const result = parser.makeAST()
            assertIsSuccess(result)
            expect(result.value).toEqual(expectedAST)
        })
    })

    describe("Error Handling", () => {
        it.each([
            {
                // formula: "1+"
                input: makeTokens([
                    { type: "number", value: "1", start: 0 },
                    { type: "op", value: "+", start: 1 },
                ]),
                description: "it fails on EOF after op",
                expectedError: "UNEXPECTED_TOKEN",
                expectedValue: "",
                expectedStart: -1,
            },
            {
                // formula: "1+SUM"
                input: makeTokens([
                    { type: "number", value: "1", start: 0 },
                    { type: "op", value: "+", start: 1 },
                    { type: "func", value: "SUM", start: 2 },
                ]),
                description: "it fails on EOF after func keyword",
                expectedError: "UNEXPECTED_TOKEN",
                expectedValue: "",
                expectedStart: -1,
            },
            {
                // formula: "1+SUM(A2:"
                input: makeTokens([
                    { type: "number", value: "1", start: 0 },
                    { type: "op", value: "+", start: 1 },
                    { type: "func", value: "SUM", start: 2 },
                    { type: "parens_open", value: "(", start: 5 },
                    { type: "cell", value: "A2", start: 6 },
                    { type: "op_range", value: ":", start: 8 },
                ]),
                description: "it fails on EOF within range expression",
                expectedError: "UNEXPECTED_TOKEN",
                expectedValue: "",
                expectedStart: -1,
            },
            {
                // formula: "1+)3*A3)"
                input: makeTokens([
                    { type: "number", value: "1", start: 0 },
                    { type: "op", value: "+", start: 1 },
                    { type: "parens_close", value: ")", start: 2 },
                    { type: "number", value: "3", start: 3 },
                    { type: "op", value: "*", start: 4 },
                    { type: "cell", value: "A3", start: 5 },
                    { type: "parens_close", value: ")", start: 7 },
                ]),
                description:
                    "it fails when bracket.close comes before bracket.open",
                expectedError: "PARENS",
                expectedValue: ")",
                expectedStart: 2,
            },
            {
                // formula: "1+(3*A3"
                input: makeTokens([
                    { type: "number", value: "1", start: 0 },
                    { type: "op", value: "+", start: 1 },
                    { type: "parens_open", value: "(", start: 2 },
                    { type: "number", value: "3", start: 3 },
                    { type: "op", value: "*", start: 4 },
                    { type: "cell", value: "A3", start: 5 },
                ]),
                description: "it fails on missing bracket.close",
                expectedError: "PARENS",
                expectedValue: "",
                expectedStart: -1,
            },
            {
                // formula: "1+(3*A3/(2+4)"
                input: makeTokens([
                    { type: "number", value: "1", start: 0 },
                    { type: "op", value: "+", start: 1 },
                    { type: "parens_open", value: "(", start: 2 },
                    { type: "number", value: "3", start: 3 },
                    { type: "op", value: "*", start: 4 },
                    { type: "cell", value: "A3", start: 5 },
                    { type: "op", value: "/", start: 7 },
                    { type: "parens_open", value: "(", start: 8 },
                    { type: "number", value: "2", start: 9 },
                    { type: "op", value: "+", start: 10 },
                    { type: "number", value: "4", start: 11 },
                ]),
                description:
                    "it fails on missing bracket.close in nested formula",
                expectedError: "PARENS",
                expectedValue: "",
                expectedStart: -1,
            },
            {
                // formula: "SUM+A1:A3)"
                input: makeTokens([
                    { type: "func", value: "SUM", start: 0 },
                    { type: "op", value: "+", start: 3 },
                    { type: "cell", value: "A1", start: 4 },
                    { type: "op_range", value: ":", start: 6 },
                    { type: "cell", value: "A3", start: 7 },
                    { type: "parens_close", value: ")", start: 9 },
                ]),
                description:
                    "it fails on missing bracket.open after function keyword",
                expectedError: "UNEXPECTED_TOKEN",
                expectedValue: "+",
                expectedStart: 3,
            },
            {
                // formula: "SUM(A1:A3*4"
                input: makeTokens([
                    { type: "func", value: "SUM", start: 0 },
                    { type: "parens_open", value: "(", start: 3 },
                    { type: "cell", value: "A1", start: 4 },
                    { type: "op_range", value: ":", start: 6 },
                    { type: "cell", value: "A3", start: 7 },
                    { type: "op", value: "*", start: 9 },
                    { type: "number", value: "4", start: 10 },
                ]),
                description:
                    "it fails on missing bracket.close after function range",
                expectedError: "UNEXPECTED_TOKEN",
                expectedValue: "*",
                expectedStart: 9,
            },
            {
                // formula: "SUM(A1+A3)"
                input: makeTokens([
                    { type: "func", value: "SUM", start: 0 },
                    { type: "parens_open", value: "(", start: 3 },
                    { type: "cell", value: "A1", start: 4 },
                    { type: "op", value: "+", start: 6 },
                    { type: "cell", value: "A3", start: 7 },
                    { type: "parens_close", value: ")", start: 9 },
                ]),
                description: "it fails on ill-formed range A",
                expectedError: "UNEXPECTED_TOKEN",
                expectedValue: "+",
                expectedStart: 6,
            },
            {
                // formula: "SUM(A1:A3:A7)"
                input: makeTokens([
                    { type: "func", value: "SUM", start: 0 },
                    { type: "parens_open", value: "(", start: 3 },
                    { type: "cell", value: "A1", start: 4 },
                    { type: "op_range", value: ":", start: 6 },
                    { type: "cell", value: "A3", start: 7 },
                    { type: "op_range", value: ":", start: 9 },
                    { type: "cell", value: "A7", start: 10 },
                    { type: "parens_open", value: ")", start: 12 },
                ]),
                description: "it fails on ill-formed range B",
                expectedError: "UNEXPECTED_TOKEN",
                expectedValue: ":",
                expectedStart: 9,
            },
        ])(
            "$description",
            ({ input, expectedError, expectedValue, expectedStart }) => {
                const parser = new Parser(input)
                const result = parser.makeAST()

                assertIsFail(result)
                expect(result.error.type).toBe(expectedError)
                expect(result.error.token.value).toBe(expectedValue)
                expect(result.error.token.start).toEqual(expectedStart)
            },
        )
    })
})
