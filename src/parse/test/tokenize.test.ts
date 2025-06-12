// =================================================
// EXAMPLE-BASED UNIT TESTS FOR THE TOKENIZE MODULE
// =================================================
import { describe, expect, it } from "vitest"
import { tokenize } from "../tokenize"
import { assertIsFail, assertIsSuccess } from "../types/errors"

describe("tokenizer", () => {
  it("handles complete formula", () => {
    const result = tokenize("11+2*(A1-B99)/SUM(C1:D2)")
    const expected = [
      { type: "number", value: "11", position: { start: 0, end: 2 } },
      { type: "op", value: "+", position: { start: 2, end: 3 } },
      { type: "number", value: "2", position: { start: 3, end: 4 } },
      { type: "op", value: "*", position: { start: 4, end: 5 } },
      { type: "parens", value: "(", position: { start: 5, end: 6 } },
      { type: "cell", value: "A1", position: { start: 6, end: 8 } },
      { type: "op", value: "-", position: { start: 8, end: 9 } },
      { type: "cell", value: "B99", position: { start: 9, end: 12 } },
      { type: "parens", value: ")", position: { start: 12, end: 13 } },
      { type: "op", value: "/", position: { start: 13, end: 14 } },
      { type: "func", value: "SUM", position: { start: 14, end: 17 } },
      { type: "parens", value: "(", position: { start: 17, end: 18 } },
      { type: "cell", value: "C1", position: { start: 18, end: 20 } },
      { type: "op", value: ":", position: { start: 20, end: 21 } },
      { type: "cell", value: "D2", position: { start: 21, end: 23 } },
      { type: "parens", value: ")", position: { start: 23, end: 24 } },
    ]

    assertIsSuccess(result)
    expect(result.value).toEqual(expected)
  })

  describe("edge cases", () => {
    it.each([
      {
        description: "it handles whitespace throughout formula",
        input: "  42 + 7 * ( A1 - B2 )  ",
        expected: [
          { type: "number", value: "42", position: { start: 2, end: 4 } },
          { type: "op", value: "+", position: { start: 5, end: 6 } },
          { type: "number", value: "7", position: { start: 7, end: 8 } },
          { type: "op", value: "*", position: { start: 9, end: 10 } },
          { type: "parens", value: "(", position: { start: 11, end: 12 } },
          { type: "cell", value: "A1", position: { start: 13, end: 15 } },
          { type: "op", value: "-", position: { start: 16, end: 17 } },
          { type: "cell", value: "B2", position: { start: 18, end: 20 } },
          { type: "parens", value: ")", position: { start: 21, end: 22 } },
        ],
      },
      {
        description: "it handles formula starting with negative number",
        input: "-11+2",
        expected: [
          { type: "op", value: "-", position: { start: 0, end: 1 } },
          { type: "number", value: "11", position: { start: 1, end: 3 } },
          { type: "op", value: "+", position: { start: 3, end: 4 } },
          { type: "number", value: "2", position: { start: 4, end: 5 } },
        ],
      },
      {
        description: "it handles single number",
        input: "42",
        expected: [
          { type: "number", value: "42", position: { start: 0, end: 2 } },
        ],
      },
      {
        description: "it handles single cell reference",
        input: "A99",
        expected: [
          { type: "cell", value: "A99", position: { start: 0, end: 3 } },
        ],
      },
    ])("$description", ({ input, expected }) => {
      const result = tokenize(input)
      assertIsSuccess(result)
      expect(result.value).toEqual(expected)
    })
  })

  describe("Error Handling", () => {
    // NOTE: Invalid chars also get caught under different error types: e.g. INVALID_NUMBER.
    // We put invalid char in front of formula to test this specifically.
    it.each([
      {
        input: "$+2*(3-4)",
        description: "it fails on invalid starting character",
        expectedError: "INVALID_CHAR",
        expectedValue: "$",
        expectedPosition: {
          start: 0,
          end: 1,
        },
      },
      {
        input: "A11+B001",
        description: "it fails on ill-formed cell reference",
        expectedError: "INVALID_CELL",
        expectedValue: "B001",
        expectedPosition: {
          start: 4,
          end: 8,
        },
      },
      {
        input: "a99+02+37b",
        description: "it fails on ill-formed number",
        expectedError: "INVALID_NUMBER",
        expectedValue: "37b",
        expectedPosition: {
          start: 7,
          end: 10,
        },
      },
      {
        input: "SUMA1:B2)*3",
        description: "it fails on function name without opening parenthesis",
        expectedError: "UNKNOWN_FUNCTION",
        expectedValue: "SUMA1",
        expectedPosition: {
          start: 0,
          end: 5,
        },
      },
    ])(
      "given input '$input', $description",
      ({ input, expectedError, expectedValue, expectedPosition }) => {
        const result = tokenize(input)

        assertIsFail(result)
        expect(result.error.type).toBe(expectedError)
        if (expectedValue) {
          expect(result.error.payload!.value).toBe(expectedValue)
          expect(result.error.payload!.position).toEqual(expectedPosition)
        }
      },
    )
  })
})
