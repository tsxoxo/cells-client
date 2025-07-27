// =================================================
// EXAMPLE-BASED UNIT TESTS FOR THE TOKENIZE MODULE
// =================================================
import { describe, expect, it } from "vitest"
import { tokenize } from "../tokenize"
import { assertIsFail, assertIsSuccess } from "../types/result"
import { Token } from "../types/token"

describe("tokenizer", () => {
    it("handles complete formula", () => {
        const result = tokenize("11+2*(A1-B99)/SUM(C1:D2)")
        const expected = [
            { type: "number", value: "11", start: 0 },
            { type: "op", value: "+", start: 2 },
            { type: "number", value: "2", start: 3 },
            { type: "op", value: "*", start: 4 },
            { type: "parens_open", value: "(", start: 5 },
            { type: "cell", value: "A1", start: 6 },
            { type: "op", value: "-", start: 8 },
            { type: "cell", value: "B99", start: 9 },
            { type: "parens_close", value: ")", start: 12 },
            { type: "op", value: "/", start: 13 },
            { type: "func", value: "SUM", start: 14 },
            { type: "parens_open", value: "(", start: 17 },
            { type: "cell", value: "C1", start: 18 },
            { type: "op_range", value: ":", start: 20 },
            { type: "cell", value: "D2", start: 21 },
            { type: "parens_close", value: ")", start: 23 },
        ] as Token[]

        assertIsSuccess(result)
        expect(result.value).toEqual(expected)
    })

    describe("edge cases", () => {
        it.each([
            {
                description: "it handles whitespace throughout formula",
                input: "  42 + 7 * ( A1 - B2 )  ",
                expected: [
                    {
                        type: "number",
                        value: "42",
                        start: 2,
                    },
                    { type: "op", value: "+", start: 5 },
                    {
                        type: "number",
                        value: "7",
                        start: 7,
                    },
                    { type: "op", value: "*", start: 9 },
                    {
                        type: "parens_open",
                        value: "(",
                        start: 11,
                    },
                    {
                        type: "cell",
                        value: "A1",
                        start: 13,
                    },
                    {
                        type: "op",
                        value: "-",
                        start: 16,
                    },
                    {
                        type: "cell",
                        value: "B2",
                        start: 18,
                    },
                    {
                        type: "parens_close",
                        value: ")",
                        start: 21,
                    },
                ] as Token[],
            },
            {
                description: "it handles formula starting with negative number",
                input: "-11+2",
                expected: [
                    { type: "op", value: "-", start: 0 },
                    {
                        type: "number",
                        value: "11",
                        start: 1,
                    },
                    { type: "op", value: "+", start: 3 },
                    {
                        type: "number",
                        value: "2",
                        start: 4,
                    },
                ] as Token[],
            },
            {
                description: "it handles single number",
                input: "42",
                expected: [
                    {
                        type: "number",
                        value: "42",
                        start: 0,
                    },
                ] as Token[],
            },
            {
                description: "it handles single cell reference",
                input: "A99",
                expected: [
                    {
                        type: "cell",
                        value: "A99",
                        start: 0,
                    },
                ] as Token[],
            },
        ])("$description", ({ input, expected }) => {
            const result = tokenize(input)
            assertIsSuccess(result)
            expect(result.value).toEqual(expected)
        })
    })

    describe("Tokenize Error Handling", () => {
        // NOTE: Invalid chars also get caught under different error types: e.g. INVALID_NUMBER.
        // We put invalid char in front of formula to test this specifically.
        it.each([
            {
                input: "$+2*(3-4)",
                description: "it fails on invalid starting character",
                expectedError: "INVALID_CHAR",
                expectedValue: "$",
                expectedStart: 0,
            },
            {
                input: "A11+B001",
                description: "it fails on ill-formed cell reference",
                expectedError: "INVALID_TOKEN",
                expectedValue: "B001",
                expectedStart: 4,
            },
            {
                input: "a99+02+37b",
                description: "it fails on char after number",
                expectedError: "INVALID_TOKEN",
                expectedValue: "b",
                expectedStart: 9,
            },
            {
                input: "SUMA1:B2)*3",
                description:
                    "it fails on function name without opening parenthesis",
                expectedError: "INVALID_TOKEN",
                expectedValue: "SUMA1",
                expectedStart: 0,
            },
        ])(
            "given input '$input', $description",
            ({ input, expectedError, expectedValue, expectedStart }) => {
                const result = tokenize(input)

                assertIsFail(result)
                expect(result.error.type).toBe(expectedError)
                expect(result.error.token.value).toBe(expectedValue)
                expect(result.error.token.start).toEqual(expectedStart)
            },
        )
    })
})
