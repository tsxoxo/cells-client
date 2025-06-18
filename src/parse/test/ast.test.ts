// =================================================
// EXAMPLE-BASED UNIT TESTS FOR THE AST MODULE
// =================================================
import { describe, expect, it } from "vitest"
import { Parser } from "../ast"
import { Node_Binary, Token, TokenType } from "../types/grammar"
import { assertIsFail, assertIsSuccess } from "../types/errors"

// =================================================
// # UTILS
// =================================================

// Make dummy tokens.
// Position data is optional.
function makeTokens(
  simplifiedTokens: {
    type: TokenType
    value: string
    position?: { start: number; end: number }
  }[],
): Token[] {
  const tokens = simplifiedTokens.map(
    ({ type, value, position }): Token => ({
      type,
      value,
      position: position ?? {
        start: 0,
        end: 0,
      },
    }),
  )

  return tokens
}

describe("ast", () => {
  it("handles complete formula", () => {
    const inputTokens = makeTokens([
      { type: "parens", value: "(", position: { start: 0, end: 1 } },
      { type: "number", value: "1", position: { start: 1, end: 2 } },
      { type: "op", value: "+", position: { start: 2, end: 3 } },
      { type: "number", value: "2", position: { start: 3, end: 4 } },
      { type: "parens", value: ")", position: { start: 4, end: 5 } },
      { type: "op", value: "*", position: { start: 5, end: 6 } },
      { type: "func", value: "SUM", position: { start: 6, end: 9 } },
      { type: "parens", value: "(", position: { start: 9, end: 10 } },
      { type: "cell", value: "A1", position: { start: 10, end: 12 } },
      { type: "op", value: ":", position: { start: 12, end: 13 } },
      { type: "cell", value: "B2", position: { start: 13, end: 15 } },
      { type: "parens", value: ")", position: { start: 15, end: 16 } },
      { type: "op", value: "/", position: { start: 16, end: 17 } },
      { type: "number", value: "3", position: { start: 17, end: 18 } },
    ])

    const expected: Node_Binary = {
      type: "binary_op",
      value: "/",
      position: { start: 0, end: 18 },
      left: {
        type: "binary_op",
        value: "*",
        position: { start: 0, end: 16 },
        left: {
          type: "binary_op",
          value: "+",
          position: { start: 1, end: 4 },
          left: {
            type: "number",
            value: "1",
            position: { start: 1, end: 2 },
          },
          right: {
            type: "number",
            value: "2",
            position: { start: 3, end: 4 },
          },
        },
        right: {
          type: "func",
          value: "SUM",
          position: { start: 6, end: 16 },
          from: {
            type: "cell",
            value: "A1",
            position: { start: 10, end: 12 },
          },
          to: { type: "cell", value: "B2", position: { start: 13, end: 15 } },
        },
      },
      right: { type: "number", value: "3", position: { start: 17, end: 18 } },
    }

    const parser = new Parser(inputTokens)
    const result = parser.makeAST()
    assertIsSuccess(result)
    expect(result.value).toEqual(expected)
  })

  describe("edge cases", () => {
    it.each([
      {
        description: "single number",
        inputTokens: makeTokens([
          { type: "number", value: "42", position: { start: 0, end: 2 } },
        ]),
        expectedAST: {
          type: "number",
          value: "42",
          position: { start: 0, end: 2 },
        },
      },
      {
        description: "single cell reference",
        inputTokens: makeTokens([
          { type: "cell", value: "A99", position: { start: 0, end: 3 } },
        ]),
        expectedAST: {
          type: "cell",
          value: "A99",
          position: { start: 0, end: 3 },
        },
      },
      {
        description: "single function",
        inputTokens: makeTokens([
          { type: "func", value: "SUM", position: { start: 0, end: 3 } },
          { type: "parens", value: "(", position: { start: 3, end: 4 } },
          { type: "cell", value: "A1", position: { start: 4, end: 6 } },
          { type: "op", value: ":", position: { start: 6, end: 7 } },
          { type: "cell", value: "A9", position: { start: 7, end: 9 } },
          { type: "parens", value: ")", position: { start: 9, end: 10 } },
        ]),
        expectedAST: {
          type: "func",
          value: "SUM",
          position: { start: 0, end: 10 },
          from: { type: "cell", value: "A1", position: { start: 4, end: 6 } },
          to: { type: "cell", value: "A9", position: { start: 7, end: 9 } },
        },
      },
      {
        description: "nested expression",
        inputTokens: makeTokens([
          { type: "parens", value: "(", position: { start: 0, end: 1 } },
          { type: "parens", value: "(", position: { start: 1, end: 2 } },
          { type: "parens", value: "(", position: { start: 2, end: 3 } },
          { type: "number", value: "1", position: { start: 3, end: 4 } },
          { type: "parens", value: ")", position: { start: 4, end: 5 } },
          { type: "parens", value: ")", position: { start: 5, end: 6 } },
          { type: "parens", value: ")", position: { start: 6, end: 7 } },
        ]),
        expectedAST: {
          type: "number",
          value: "1",
          position: { start: 3, end: 4 },
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
        input: makeTokens([
          { type: "number", value: "1", position: { start: 0, end: 1 } },
          { type: "op", value: "+", position: { start: 1, end: 2 } },
        ]),
        description: "it fails on EOF after op",
        expectedError: "UNEXPECTED_EOF",
        expectedValue: null,
        expectedPosition: null,
      },
      {
        input: makeTokens([
          { type: "number", value: "1", position: { start: 0, end: 1 } },
          { type: "op", value: "+", position: { start: 1, end: 2 } },
          { type: "func", value: "SUM", position: { start: 2, end: 5 } },
        ]),
        description: "it fails on EOF after func keyword",
        expectedError: "UNEXPECTED_EOF",
        expectedValue: "SUM",
        expectedPosition: { start: 2, end: 5 },
      },
      {
        input: makeTokens([
          { type: "number", value: "1", position: { start: 0, end: 1 } },
          { type: "op", value: "+", position: { start: 1, end: 2 } },
          { type: "func", value: "SUM", position: { start: 2, end: 5 } },
          { type: "parens", value: "(", position: { start: 5, end: 6 } },
          { type: "cell", value: "A2", position: { start: 6, end: 8 } },
          { type: "op", value: ":", position: { start: 8, end: 9 } },
        ]),
        description: "it fails on EOF within range expression",
        expectedError: "UNEXPECTED_EOF",
        expectedValue: ":",
        expectedPosition: { start: 8, end: 9 },
      },
      {
        input: makeTokens([
          { type: "number", value: "1", position: { start: 0, end: 1 } },
          { type: "op", value: "+", position: { start: 1, end: 2 } },
          { type: "parens", value: ")", position: { start: 2, end: 3 } },
          { type: "number", value: "3", position: { start: 3, end: 4 } },
          { type: "op", value: "*", position: { start: 4, end: 5 } },
          { type: "cell", value: "A3", position: { start: 5, end: 7 } },
          { type: "parens", value: ")", position: { start: 7, end: 8 } },
        ]),
        description: "it fails when bracket.close comes before bracket.open",
        expectedError: "UNEXPECTED_TOKEN",
        expectedValue: ")",
        expectedPosition: { start: 2, end: 3 },
      },
      {
        input: makeTokens([
          { type: "number", value: "1", position: { start: 0, end: 1 } },
          { type: "op", value: "+", position: { start: 1, end: 2 } },
          { type: "parens", value: "(", position: { start: 2, end: 3 } },
          { type: "number", value: "3", position: { start: 3, end: 4 } },
          { type: "op", value: "*", position: { start: 4, end: 5 } },
          { type: "cell", value: "A3", position: { start: 5, end: 7 } },
        ]),
        description: "it fails on missing bracket.close",
        expectedError: "PARENS",
        expectedValue: null,
        expectedPosition: null,
      },
      {
        input: makeTokens([
          { type: "number", value: "1", position: { start: 0, end: 1 } },
          { type: "op", value: "+", position: { start: 1, end: 2 } },
          { type: "parens", value: "(", position: { start: 2, end: 3 } },
          { type: "number", value: "3", position: { start: 3, end: 4 } },
          { type: "op", value: "*", position: { start: 4, end: 5 } },
          { type: "cell", value: "A3", position: { start: 5, end: 7 } },
          { type: "op", value: "/", position: { start: 7, end: 8 } },
          { type: "parens", value: "(", position: { start: 8, end: 9 } },
          { type: "number", value: "2", position: { start: 9, end: 10 } },
          { type: "op", value: "+", position: { start: 10, end: 11 } },
          { type: "number", value: "4", position: { start: 11, end: 12 } },
        ]),
        description: "it fails on missing bracket.close in nested formula",
        expectedError: "PARENS",
        expectedValue: null,
        expectedPosition: null,
      },
      {
        input: makeTokens([
          { type: "func", value: "SUM", position: { start: 0, end: 3 } },
          { type: "op", value: "+", position: { start: 3, end: 4 } },
          { type: "cell", value: "A1", position: { start: 4, end: 6 } },
          { type: "op", value: ":", position: { start: 6, end: 7 } },
          { type: "cell", value: "A3", position: { start: 7, end: 9 } },
          { type: "parens", value: ")", position: { start: 9, end: 10 } },
        ]),
        description: "it fails on missing bracket.open after function keyword",
        expectedError: "UNEXPECTED_TOKEN",
        expectedValue: "+",
        expectedPosition: { start: 3, end: 4 },
      },
      {
        input: makeTokens([
          { type: "func", value: "SUM", position: { start: 0, end: 3 } },
          { type: "parens", value: "(", position: { start: 3, end: 4 } },
          { type: "cell", value: "A1", position: { start: 4, end: 6 } },
          { type: "op", value: ":", position: { start: 6, end: 7 } },
          { type: "cell", value: "A3", position: { start: 7, end: 9 } },
          { type: "op", value: "*", position: { start: 9, end: 10 } },
          { type: "number", value: "4", position: { start: 10, end: 11 } },
        ]),
        description: "it fails on missing bracket.close after function range",
        expectedError: "PARENS",
        expectedValue: "*",
        expectedPosition: { start: 9, end: 10 },
      },
      {
        input: makeTokens([
          { type: "func", value: "SUM", position: { start: 0, end: 3 } },
          { type: "parens", value: "(", position: { start: 3, end: 4 } },
          { type: "cell", value: "A1", position: { start: 4, end: 6 } },
          { type: "op", value: "+", position: { start: 6, end: 7 } },
          { type: "cell", value: "A3", position: { start: 7, end: 9 } },
          { type: "parens", value: ")", position: { start: 9, end: 10 } },
        ]),
        description: "it fails on ill-formed range A",
        expectedError: "UNEXPECTED_TOKEN",
        expectedValue: "+",
        expectedPosition: { start: 6, end: 7 },
      },
      {
        input: makeTokens([
          { type: "func", value: "SUM", position: { start: 0, end: 3 } },
          { type: "parens", value: "(", position: { start: 3, end: 4 } },
          { type: "cell", value: "A1", position: { start: 4, end: 6 } },
          { type: "op", value: ":", position: { start: 6, end: 7 } },
          { type: "cell", value: "A3", position: { start: 7, end: 9 } },
          { type: "op", value: ":", position: { start: 9, end: 10 } },
          { type: "cell", value: "A7", position: { start: 10, end: 12 } },
          { type: "parens", value: ")", position: { start: 12, end: 13 } },
        ]),
        description: "it fails on ill-formed range B",
        expectedError: "UNEXPECTED_TOKEN",
        expectedValue: ":",
        expectedPosition: { start: 9, end: 10 },
      },
    ])(
      "given input based on '$description', $description",
      ({ input, expectedError, expectedValue, expectedPosition }) => {
        const parser = new Parser(input)
        const result = parser.makeAST()

        assertIsFail(result)
        expect(result.error.type).toBe(expectedError)
        if (expectedValue !== null) {
          expect(result.error.payload!.value).toBe(expectedValue)
        } else {
          expect(result.error.payload).toBe(null)
        }
        if (expectedPosition !== null) {
          expect(result.error.payload!.position).toEqual(expectedPosition)
        }
      },
    )
  })
})
