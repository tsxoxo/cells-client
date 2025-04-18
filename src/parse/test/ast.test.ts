import { assert, describe, expect, it } from "vitest"
import { Parser } from "../ast"
import { Token, TokenType, Tree, Node_Binary } from "../types/grammar"
import { Result, Success } from "../types/errors"

// =================================================
// # UTILS
// =================================================
function makeTokens(
  simplifiedTokens: { type: TokenType; value: string }[],
): Token[] {
  const tokens = simplifiedTokens.map(
    ({ type, value }): Token => ({
      type,
      value,
      // Dummy prop ignored in testing.
      position: {
        start: 0,
        end: 0,
      },
    }),
  )

  return tokens
}

function assertBinaryOp(node: Tree): asserts node is Node_Binary {
  if (node.type !== "binary_op") {
    throw new Error(
      `node is not of type "binary_op! node: ${JSON.stringify(node)}`,
    )
  }
}

function assertIsSuccess<T, E>(
  result: Result<T, E>,
): asserts result is Success<T> {
  if (!result.ok) {
    throw new Error(
      `result is not a success! error: ${JSON.stringify(result.error)}`,
    )
  }
}

// =================================================
// # TEST DATA
// =================================================

// "2+3"
const validExpressionTokens = makeTokens([
  { type: "number", value: "2" },
  { type: "op", value: "+" },
  { type: "number", value: "3" },
])
const validExpressionTree = {
  type: "binary_op",
  value: "+",
  left: { type: "number", value: "2" },
  right: { type: "number", value: "3" },
}

// "2*3"
const validTermTokens = makeTokens([
  { type: "number", value: "2" },
  { type: "op", value: "*" },
  { type: "number", value: "3" },
])
const validTermTree = {
  type: "binary_op",
  value: "*",
  left: { type: "number", value: "2" },
  right: { type: "number", value: "3" },
}

// "1+2*3"
const validExpressionWithTermTokens = makeTokens([
  { type: "number", value: "1" },
  { type: "op", value: "+" },
  { type: "number", value: "2" },
  { type: "op", value: "*" },
  { type: "number", value: "3" },
])

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

  it("parses parens", () => {
    // "(1+2)*3"
    const parser = new Parser(validParens)
    const parseResult = parser.makeAST()

    assertIsSuccess(parseResult)

    const tree = parseResult.value

    assertBinaryOp(tree)
    console.dir(tree)

    expect(tree.value).toEqual("*")

    assertBinaryOp(tree.left)
    expect(tree.left.value).toEqual("+")
    expect(tree.left.left.value).toEqual("1")
    expect(tree.left.right.value).toEqual("2")

    expect(tree.right.type).toEqual("number")
    expect(tree.right.value).toEqual("3")
  })
})
