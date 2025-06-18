// =================================================
// EXAMPLE-BASED UNIT TESTS FOR THE AST MODULE
// =================================================
import { describe, expect, it } from "vitest"
import { Parser } from "../ast"
import { Token, TokenType } from "../types/grammar"
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
  describe("standard valid cases (no edge-cases)", () => {
    it.each([
      {
        description: "parenthesized addition",
        // formula: "(1+2)"
        inputTokens: makeTokens([
          { type: "parens", value: "(", position: { start: 0, end: 1 } },
          { type: "number", value: "1", position: { start: 1, end: 2 } },
          { type: "op", value: "+", position: { start: 2, end: 3 } },
          { type: "number", value: "2", position: { start: 3, end: 4 } },
          { type: "parens", value: ")", position: { start: 4, end: 5 } },
        ]),
        expectedAST: {
          type: "binary_op",
          value: "+",
          position: { start: 0, end: 5 },
          left: { type: "number", value: "1", position: { start: 1, end: 2 } },
          right: { type: "number", value: "2", position: { start: 3, end: 4 } },
        },
      },
      {
        description: "function with range",
        // formula: "SUM(A1:B2)"
        inputTokens: makeTokens([
          { type: "func", value: "SUM", position: { start: 0, end: 3 } },
          { type: "parens", value: "(", position: { start: 3, end: 4 } },
          { type: "cell", value: "A1", position: { start: 4, end: 6 } },
          { type: "op", value: ":", position: { start: 6, end: 7 } },
          { type: "cell", value: "B2", position: { start: 7, end: 9 } },
          { type: "parens", value: ")", position: { start: 9, end: 10 } },
        ]),
        expectedAST: {
          type: "func",
          value: "SUM",
          position: { start: 0, end: 10 },
          from: { type: "cell", value: "A1", position: { start: 4, end: 6 } },
          to: { type: "cell", value: "B2", position: { start: 7, end: 9 } },
        },
      },
      {
        description: "simple division",
        // formula: "6/3"
        inputTokens: makeTokens([
          { type: "number", value: "6", position: { start: 0, end: 1 } },
          { type: "op", value: "/", position: { start: 1, end: 2 } },
          { type: "number", value: "3", position: { start: 2, end: 3 } },
        ]),
        expectedAST: {
          type: "binary_op",
          value: "/",
          position: { start: 0, end: 3 },
          left: { type: "number", value: "6", position: { start: 0, end: 1 } },
          right: { type: "number", value: "3", position: { start: 2, end: 3 } },
        },
      },
      {
        description: "parenthesized expression with multiplication",
        // formula: "(1+2)*3"
        inputTokens: makeTokens([
          { type: "parens", value: "(", position: { start: 0, end: 1 } },
          { type: "number", value: "1", position: { start: 1, end: 2 } },
          { type: "op", value: "+", position: { start: 2, end: 3 } },
          { type: "number", value: "2", position: { start: 3, end: 4 } },
          { type: "parens", value: ")", position: { start: 4, end: 5 } },
          { type: "op", value: "*", position: { start: 5, end: 6 } },
          { type: "number", value: "3", position: { start: 6, end: 7 } },
        ]),
        expectedAST: {
          type: "binary_op",
          value: "*",
          position: { start: 0, end: 7 },
          left: {
            type: "binary_op",
            value: "+",
            position: { start: 0, end: 5 },
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
          right: { type: "number", value: "3", position: { start: 6, end: 7 } },
        },
      },
      {
        description: "function with division",
        // formula: "SUM(A1:B2)/3"
        inputTokens: makeTokens([
          { type: "func", value: "SUM", position: { start: 0, end: 3 } },
          { type: "parens", value: "(", position: { start: 3, end: 4 } },
          { type: "cell", value: "A1", position: { start: 4, end: 6 } },
          { type: "op", value: ":", position: { start: 6, end: 7 } },
          { type: "cell", value: "B2", position: { start: 7, end: 9 } },
          { type: "parens", value: ")", position: { start: 9, end: 10 } },
          { type: "op", value: "/", position: { start: 10, end: 11 } },
          { type: "number", value: "3", position: { start: 11, end: 12 } },
        ]),
        expectedAST: {
          type: "binary_op",
          value: "/",
          position: { start: 0, end: 12 },
          left: {
            type: "func",
            value: "SUM",
            position: { start: 0, end: 10 },
            from: { type: "cell", value: "A1", position: { start: 4, end: 6 } },
            to: { type: "cell", value: "B2", position: { start: 7, end: 9 } },
          },
          right: {
            type: "number",
            value: "3",
            position: { start: 11, end: 12 },
          },
        },
      },
      {
        description: "complete formula with all operations",
        // formula: "(1+2)*SUM(A1:B2)/3"
        inputTokens: makeTokens([
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
        ]),
        expectedAST: {
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
              to: {
                type: "cell",
                value: "B2",
                position: { start: 13, end: 15 },
              },
            },
          },
          right: {
            type: "number",
            value: "3",
            position: { start: 17, end: 18 },
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
        // formula: "A99"
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
        // formula: "SUM(A1:A9)"
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
        // formula: "1*(10/(1-(2*6))+7)"
        inputTokens: makeTokens([
          { type: "number", value: "1", position: { start: 0, end: 1 } },
          { type: "op", value: "*", position: { start: 1, end: 2 } },
          { type: "parens", value: "(", position: { start: 2, end: 3 } },
          { type: "number", value: "10", position: { start: 3, end: 5 } },
          { type: "op", value: "/", position: { start: 5, end: 6 } },
          { type: "parens", value: "(", position: { start: 6, end: 7 } },
          { type: "number", value: "1", position: { start: 7, end: 8 } },
          { type: "op", value: "-", position: { start: 8, end: 9 } },
          { type: "parens", value: "(", position: { start: 9, end: 10 } },
          { type: "number", value: "2", position: { start: 10, end: 11 } },
          { type: "op", value: "*", position: { start: 11, end: 12 } },
          { type: "number", value: "6", position: { start: 12, end: 13 } },
          { type: "parens", value: ")", position: { start: 13, end: 14 } },
          { type: "parens", value: ")", position: { start: 14, end: 15 } },
          { type: "op", value: "+", position: { start: 15, end: 16 } },
          { type: "number", value: "7", position: { start: 16, end: 17 } },
          { type: "parens", value: ")", position: { start: 17, end: 18 } },
        ]),
        expectedAST: {
          type: "binary_op",
          value: "*",
          position: { start: 0, end: 18 },
          left: { type: "number", value: "1", position: { start: 0, end: 1 } },
          right: {
            type: "binary_op",
            value: "+",
            position: { start: 3, end: 17 },
            left: {
              type: "binary_op",
              value: "/",
              position: { start: 3, end: 15 },
              left: {
                type: "number",
                value: "10",
                position: { start: 3, end: 5 },
              },
              right: {
                type: "binary_op",
                value: "-",
                position: { start: 7, end: 14 },
                left: {
                  type: "number",
                  value: "1",
                  position: { start: 7, end: 8 },
                },
                right: {
                  type: "binary_op",
                  value: "*",
                  position: { start: 10, end: 13 },
                  left: {
                    type: "number",
                    value: "2",
                    position: { start: 10, end: 11 },
                  },
                  right: {
                    type: "number",
                    value: "6",
                    position: { start: 12, end: 13 },
                  },
                },
              },
            },
            right: {
              type: "number",
              value: "7",
              position: { start: 16, end: 17 },
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
          { type: "number", value: "1", position: { start: 0, end: 1 } },
          { type: "op", value: "+", position: { start: 1, end: 2 } },
        ]),
        description: "it fails on EOF after op",
        expectedError: "UNEXPECTED_TOKEN",
        expectedValue: "",
        expectedPosition: { start: -1, end: -1 },
      },
      {
        // formula: "1+SUM"
        input: makeTokens([
          { type: "number", value: "1", position: { start: 0, end: 1 } },
          { type: "op", value: "+", position: { start: 1, end: 2 } },
          { type: "func", value: "SUM", position: { start: 2, end: 5 } },
        ]),
        description: "it fails on EOF after func keyword",
        expectedError: "UNEXPECTED_TOKEN",
        expectedValue: "",
        expectedPosition: { start: -1, end: -1 },
      },
      {
        // formula: "1+SUM(A2:"
        input: makeTokens([
          { type: "number", value: "1", position: { start: 0, end: 1 } },
          { type: "op", value: "+", position: { start: 1, end: 2 } },
          { type: "func", value: "SUM", position: { start: 2, end: 5 } },
          { type: "parens", value: "(", position: { start: 5, end: 6 } },
          { type: "cell", value: "A2", position: { start: 6, end: 8 } },
          { type: "op", value: ":", position: { start: 8, end: 9 } },
        ]),
        description: "it fails on EOF within range expression",
        expectedError: "UNEXPECTED_TOKEN",
        expectedValue: "",
        expectedPosition: { start: -1, end: -1 },
      },
      {
        // formula: "1+)3*A3)"
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
        // formula: "1+(3*A3"
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
        expectedValue: "",
        expectedPosition: { start: -1, end: -1 },
      },
      {
        // formula: "1+(3*A3/(2+4)"
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
        expectedValue: "",
        expectedPosition: { start: -1, end: -1 },
      },
      {
        // formula: "SUM+A1:A3)"
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
        // formula: "SUM(A1:A3*4"
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
        // formula: "SUM(A1+A3)"
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
        // formula: "SUM(A1:A3:A7)"
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
        expect(result.error.payload!.value).toBe(expectedValue)
        expect(result.error.payload!.position).toEqual(expectedPosition)
      },
    )
  })
})
