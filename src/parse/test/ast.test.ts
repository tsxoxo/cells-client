import { assert, assert, describe, expect, it } from "vitest"
import { Parser } from "../ast"
import { Token, TokenType } from "../types/grammar"

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

describe("Parser", () => {
  it("parses expression", () => {
    const parser = new Parser(validExpressionTokens)
    const parseResult = parser.makeAST()

    assert(parseResult.ok === true)
    expect(parseResult.value).toEqual(validExpressionTree)
  })

  it("parses term", () => {
    const parser = new Parser(validTermTokens)
    const parseResult = parser.makeAST()

    assert(parseResult.ok === true)
    expect(parseResult.value).toEqual(validTermTree)
  })

  it("parses expression with term", () => {
    const parser = new Parser(validExpressionWithTermTokens)
    const parseResult = parser.makeAST()

    assert(parseResult.ok === true)

    const tree = parseResult.value

    assert(tree.type === "binary_op")

    expect(tree.value).toEqual("+")
    expect(tree.left.value).toEqual("1")
    expect(tree.right.type).toEqual("binary_op")
    expect(tree.right.value).toEqual("*")
  })
})
