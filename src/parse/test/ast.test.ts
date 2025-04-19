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

// TODO: Cell refs

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
  { type: "func", value: "SUM" },
  { type: "parens", value: "(" },
  { type: "cell", value: "A1" },
  { type: "op", value: ":" },
  { type: "cell", value: "A2" },
  { type: "parens", value: ")" },
  { type: "op", value: "*" },
  { type: "number", value: "3" },
])

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
const invFunc_missingOpen = makeTokens([
  { type: "func", value: "SUM" },
  { type: "cell", value: "A1" },
  { type: "op", value: ":" },
  { type: "cell", value: "A2" },
  { type: "parens", value: ")" },
  { type: "op", value: "*" },
  { type: "number", value: "3" },
])
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

  it("parses functions", () => {
    // "SUM(A1:A2)*3"
    const parser = new Parser(validFunc)
    const parseResult = parser.makeAST()

    assertIsSuccess(parseResult)

    const tree = parseResult.value

    assertBinaryOp(tree)

    expect(tree.value).toEqual("*")

    assert(tree.left.type === "func")
    expect(tree.left.value).toEqual("SUM")
    expect(tree.left.from).toEqual("A1")
    expect(tree.left.to).toEqual("A2")

    expect(tree.right.type).toEqual("number")
    expect(tree.right.value).toEqual("3")
  })

  it("catches invalid token inside function", () => {
    // "SUM(A1*A2)*3"
    const parser = new Parser(invFunc_token)
    const parseResult = parser.makeAST()

    assert(parseResult.ok === false)
    expect(parseResult.error.type).toEqual("TOKEN")
    expect(parseResult.error.token!.value).toEqual("*")
  })

  it("catches invalid parens around function", () => {
    // that's actually gonna be caught by the tokenizer i think
    // "SUMA1:A2)*3"
    //const missingOpen = new Parser(invFunc_missingOpen).makeAST()

    // "SUM(A1:A2*3"
    const missingClose = new Parser(invFunc_missingClose).makeAST()
    // "SUM((A1:A2)*3"
    const doubleOpen = new Parser(invFunc_doubleOpen).makeAST()

    //assert(missingOpen.ok === false)
    //expect(missingOpen.error.type).toEqual("PARENS")
    //expect(missingOpen.error.token!.value).toEqual("*")
    assert(missingClose.ok === false)
    expect(missingClose.error.type).toEqual("PARENS")
    expect(missingClose.error.token!.value).toEqual("*")

    assert(doubleOpen.ok === false)
    expect(doubleOpen.error.type).toEqual("TOKEN")
    expect(doubleOpen.error.token!.value).toEqual("(")
  })
})
