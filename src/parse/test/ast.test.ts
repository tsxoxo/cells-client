// =================================================
// EXAMPLE-BASED UNIT TESTS FOR THE AST MODULE
// =================================================
import { describe, expect, it } from "vitest"
import { Parser } from "../ast"
import { Token, TokenType } from "../types/grammar"
import { assertBinaryOp, assertIsFail, assertIsSuccess } from "../types/errors"

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

// =================================================
// # TEST DATA
// =================================================

// "2+3"
const validExpressionTokens = makeTokens([
  { type: "number", value: "2", position: { start: 0, end: 1 } },
  { type: "op", value: "+", position: { start: 1, end: 2 } },
  { type: "number", value: "3", position: { start: 2, end: 3 } },
])

const validExpressionTree = {
  type: "binary_op",
  value: "+",
  position: { start: 0, end: 3 }, // Entire expression
  left: {
    type: "number",
    value: "2",
    position: { start: 0, end: 1 },
  },
  right: {
    type: "number",
    value: "3",
    position: { start: 2, end: 3 },
  },
}

// "2*3"
const validTermTokens = makeTokens([
  { type: "number", value: "2", position: { start: 0, end: 1 } },
  { type: "op", value: "*", position: { start: 1, end: 2 } },
  { type: "number", value: "3", position: { start: 2, end: 3 } },
])
const validTermTree = {
  type: "binary_op",
  value: "*",
  position: { start: 0, end: 3 }, // Entire expression
  left: {
    type: "number",
    value: "2",
    position: { start: 0, end: 1 },
  },
  right: {
    type: "number",
    value: "3",
    position: { start: 2, end: 3 },
  },
}

// "1+2*3"
const validExpressionWithTermTokens = makeTokens([
  { type: "number", value: "1" },
  { type: "op", value: "+" },
  { type: "number", value: "2" },
  { type: "op", value: "*" },
  { type: "number", value: "3" },
])

// Edge: chained multiplication
const validChainedMultTokens = makeTokens([
  { type: "number", value: "2" },
  { type: "op", value: "*" },
  { type: "number", value: "3" },
  { type: "op", value: "*" },
  { type: "number", value: "4" },
])
// const validChainedMultTree
//   type: "binary_op",
//   value: "*",
//   left: { type: "number", value: "2" },
//   right: { type: "number", value: "3" },
// }

// cell refs
// "A00*a1"
const validCells = makeTokens([
  { type: "cell", value: "A00", position: { start: 0, end: 3 } },
  { type: "op", value: "*", position: { start: 3, end: 4 } },
  { type: "cell", value: "a1", position: { start: 4, end: 6 } },
])
const validCellsTree = {
  type: "binary_op",
  value: "*",
  position: { start: 0, end: 6 }, // Entire expression
  left: {
    type: "cell",
    value: "A00",
    position: { start: 0, end: 3 },
  },
  right: {
    type: "cell",
    value: "a1",
    position: { start: 4, end: 6 },
  },
}

// Brackets
// "(1+2)*3"
const validParens = makeTokens([
  { type: "parens", value: "(" },
  { type: "number", value: "1" },
  { type: "op", value: "+" },
  { type: "number", value: "2" },
  { type: "parens", value: ")" },
  { type: "op", value: "*" },
  { type: "number", value: "3" },
])

// Functions
// "SUM(A1:A2)*3"
const validFunc = makeTokens([
  { type: "func", value: "SUM", position: { start: 0, end: 3 } },
  { type: "parens", value: "(", position: { start: 3, end: 4 } },
  { type: "cell", value: "A1", position: { start: 4, end: 6 } },
  { type: "op", value: ":", position: { start: 6, end: 7 } },
  { type: "cell", value: "A2", position: { start: 7, end: 9 } },
  { type: "parens", value: ")", position: { start: 9, end: 10 } },
  { type: "op", value: "*", position: { start: 10, end: 11 } },
  { type: "number", value: "3", position: { start: 11, end: 12 } },
])
const validFuncTree = {
  type: "binary_op",
  value: "*",
  position: { start: 0, end: 12 }, // Entire expression
  left: {
    type: "func",
    value: "SUM",
    position: { start: 0, end: 10 }, // "SUM(A1:A2)"
    from: {
      type: "cell",
      value: "A1",
      position: { start: 4, end: 6 },
    },
    to: {
      type: "cell",
      value: "A2",
      position: { start: 7, end: 9 },
    },
  },
  right: {
    type: "number",
    value: "3",
    position: { start: 11, end: 12 },
  },
}
// INVALID
// Functions
// Invalid token
// "SUM(A1*A2)*3"
const invFunc_token = makeTokens([
  { type: "func", value: "SUM" },
  { type: "parens", value: "(" },
  { type: "cell", value: "A1" },
  { type: "op", value: "*" },
  { type: "cell", value: "A2" },
  { type: "parens", value: ")" },
  { type: "op", value: "*" },
  { type: "number", value: "3" },
])

// Bad parens
const invFunc_missingClose = makeTokens([
  { type: "func", value: "SUM" },
  { type: "parens", value: "(" },
  { type: "cell", value: "A1" },
  { type: "op", value: ":" },
  { type: "cell", value: "A2" },
  { type: "op", value: "*" },
  { type: "number", value: "3" },
])
const invFunc_doubleOpen = makeTokens([
  { type: "func", value: "SUM" },
  { type: "parens", value: "(" },
  { type: "parens", value: "(" },
  { type: "cell", value: "A1" },
  { type: "op", value: ":" },
  { type: "cell", value: "A2" },
  { type: "parens", value: ")" },
  { type: "op", value: "*" },
  { type: "number", value: "3" },
])
const invFunc_missingSecondCell = makeTokens([
  { type: "func", value: "SUM" },
  { type: "parens", value: "(" },
  { type: "cell", value: "A1" },
  { type: "op", value: ":" },
  { type: "parens", value: ")" },
])

describe("Parser", () => {
  it("parses expression", () => {
    const parser = new Parser(validExpressionTokens)
    const parseResult = parser.makeAST()

    assertIsSuccess(parseResult)

    expect(parseResult.value).toEqual(validExpressionTree)
  })

  it("parses term", () => {
    const parser = new Parser(validTermTokens)
    const parseResult = parser.makeAST()

    assertIsSuccess(parseResult)

    expect(parseResult.value).toEqual(validTermTree)
  })

  it("parses expression with term", () => {
    const parser = new Parser(validExpressionWithTermTokens)
    const parseResult = parser.makeAST()

    assertIsSuccess(parseResult)

    const tree = parseResult.value

    assertBinaryOp(tree)

    expect(tree.value).toEqual("+")
    expect(tree.left.value).toEqual("1")
    expect(tree.right.type).toEqual("binary_op")
    expect(tree.right.value).toEqual("*")
  })

  it("parses chained multiplication", () => {
    const parser = new Parser(validChainedMultTokens)
    const parseResult = parser.makeAST()

    assertIsSuccess(parseResult)

    const tree = parseResult.value

    assertBinaryOp(tree)

    expect(tree.value).toEqual("*")
    expect(tree.left.type).toEqual("binary_op")
    expect(tree.left.value).toEqual("*")
    expect(tree.right.value).toEqual("4")
  })

  it("parses cells", () => {
    const parser = new Parser(validCells)
    const parseResult = parser.makeAST()

    assertIsSuccess(parseResult)

    expect(parseResult.value).toEqual(validCellsTree)
  })

  it("parses parens", () => {
    // "(1+2)*3"
    const parser = new Parser(validParens)
    const parseResult = parser.makeAST()

    assertIsSuccess(parseResult)

    const tree = parseResult.value

    assertBinaryOp(tree)

    expect(tree.value).toEqual("*")

    assertBinaryOp(tree.left)
    expect(tree.left.value).toEqual("+")
    expect(tree.left.left.value).toEqual("1")
    expect(tree.left.right.value).toEqual("2")

    expect(tree.right.type).toEqual("number")
    expect(tree.right.value).toEqual("3")
  })

  it("parses functions", () => {
    // "SUM(A1:A2)*3"
    const parser = new Parser(validFunc)
    const parseResult = parser.makeAST()

    assertIsSuccess(parseResult)

    const tree = parseResult.value
    expect(tree).toEqual(validFuncTree)
  })

  it("catches invalid token inside function", () => {
    // "SUM(A1*A2)*3"
    const parser = new Parser(invFunc_token)
    const parseResult = parser.makeAST()

    assertIsFail(parseResult)
    expect(parseResult.error.type).toEqual("UNEXPECTED_TOKEN")
    expect(parseResult.error.payload!.value).toEqual("*")
  })

  it("catches invalid parens around function", () => {
    // "SUM(A1:A2*3"
    const missingClose = new Parser(invFunc_missingClose).makeAST()
    // "SUM((A1:A2)*3"
    const doubleOpen = new Parser(invFunc_doubleOpen).makeAST()

    //
    const missingSecondCell = new Parser(invFunc_missingSecondCell).makeAST()

    assertIsFail(missingSecondCell)
    expect(missingSecondCell.error.type).toBe("UNEXPECTED_TOKEN")
    expect(missingSecondCell.error.msg).toContain("range")
    expect(missingSecondCell.error.payload!.value).toBe(")")

    assertIsFail(missingClose)
    expect(missingClose.error.type).toEqual("PARENS")
    expect(missingClose.error.payload!.value).toEqual("*")

    assertIsFail(doubleOpen)
    expect(doubleOpen.error.type).toEqual("UNEXPECTED_TOKEN")
    expect(doubleOpen.error.payload!.value).toEqual("(")
  })
})


describe("ast", () => {
  it("handles complete formula", () => {
    const result = makeTokens([
    // fill this in with the appropiate arguments, including valid position data for each token.
    ]
    const expected: Node_Binary = {
    // should correspond to the result: Token[] that we just defined. 
    }

    assertIsSuccess(result)
    expect(result.value).toEqual(expected)
  })

  describe("edge cases", () => {
    it.each([
      {
        description: "single number",
        input: // of type Token[],
        expected: // of type Node_Number
        },
      {
        description: "single cell reference",
        input: // of type Token[],
        expected: // of type Node_Cell
        },
      {
        description: "single function",
        input: // of type Token[],
        expected: // of type Node_Func
        },
      {
        description: "nested expression",
        input: // of type Token[]. use 3 levels of nested brackets.
        expected: // of type Node_Func
        },
        ],
      },
    ])("$description", ({ input, expected }) => {
      const result = tokenize(input)
      assertIsSuccess(result)
      expect(result.value).toEqual(expected)
    })
  })

  describe("Error Handling", () => {
    it.each([
      {
        input: // of type Token[]. based on formula "1+"
        description: "it fails on EOF after op",
        expectedError: "UNEXPECTED_EOF",
        expectedValue: "+",
        expectedPosition:// should correspond to token position of "+" within the input string}
        { start: //number,
        end: //number}
        }
        },
      {
        input: // based on formula "1+SUM"
        description: "it fails on EOF after func keyword",
        expectedError: "UNEXPECTED_EOF",
        expectedValue: "SUM"
        expectedPosition
        },
      {
        input: // based on formula "1+SUM(A2:)"
        description: "it fails on EOF within range expression",
        expectedError: "UNEXPECTED_EOF",
        expectedValue: ":"
        expectedPosition
        },
      {
        input: "SUM+A1:A3)",
        description: "it fails on missing bracket.open after function keyword",
        expectedError: "PARENS", // would "PARENS" be a more specific type?
        expectedValue: "SUM",
        expectedPosition: ,
      },
      {
        input: "SUM(A1:A3*4",
        description: "it fails on bracket.close after function range",
        expectedError: "PARENS", // would "PARENS" be a more specific type?
        expectedValue: "SUM",
        expectedPosition: ,
      },
      {
        input: "SUM(A1+A3)",
        description: "it fails on ill-formed range A",
        expectedError: "UNEXPECTED_TOKEN", // would "PARENS" be a more specific type?
        expectedValue: "SUM",
        expectedPosition: ,
      },
      {
        input: "SUM(A1:A3:A7)",
        description: "it fails on ill-formed range B",
        expectedError: "UNEXPECTED_TOKEN", // would "PARENS" be a more specific type?
        expectedValue: "SUM",
        expectedPosition: ,
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
