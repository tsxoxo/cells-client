// =================================================
// AST-maker
// =================================================
//
// Takes an array of tokens,
// outputs a tree structure.
//
// Uses the grammar specified in ./types/grammar.ts

import {
  Failure,
  Result,
  fail,
  success,
  isSuccess,
  ASTErrorType,
  ParseError,
} from "./types/errors.ts"
import { Node_Binary, Node_Cell, Token, Node } from "./types/grammar.ts"

export class Parser {
  readonly tokens: Token[]
  current: number

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.current = 0
  }

  // Main function
  makeAST(): Result<Node, ParseError> {
    const result = this.parseExpression()

    return result
  }

  private createError({
    type,
    token,
    expected,
  }: {
    type: ASTErrorType
    token: Token | null
    expected: string
  }): Failure<ParseError> {
    const tokenDisplayString = token === null ? "null" : token.value
    return fail({
      type,
      payload: token,
      msg: `${type} in makeAST: expected [${expected}], got [${tokenDisplayString}]`,
    })
  }

  private peek() {
    if (this.current >= this.tokens.length) {
      return null
    }
    return this.tokens[this.current]
  }

  private consume() {
    if (this.current >= this.tokens.length) {
      return null
    }
    this.current++
    return this.tokens[this.current - 1]
  }

  private parseExpression(): Result<Node, ParseError> {
    const expr = this.parseTerm()
    let exprBinary = null

    if (!isSuccess(expr)) {
      return expr
    }

    while (this.peek()?.type === "op") {
      const token = this.peek()
      if (token?.value === "+" || token?.value === "-") {
        const op = token?.value as string
        this.consume()

        const right = this.parseTerm()

        if (!isSuccess(right)) {
          return right
        }

        exprBinary = {
          type: "binary_op" as const,
          value: op,
          position: {
            start: expr.value.position.start,
            end: right.value.position.end,
          },
          left: exprBinary ? exprBinary : expr.value,
          right: right.value,
        }
      } else {
        break
      }
    }

    return exprBinary ? success(exprBinary) : expr
  }

  private parseTerm(): Result<Node, ParseError> {
    const term = this.parseFactor()
    let termBinary: Node_Binary | null = null

    if (!isSuccess(term)) {
      return term
    }

    while (this.peek()?.type === "op") {
      const op = this.peek()
      if (op?.value === "*" || op?.value === "/") {
        this.consume()

        // 'term', defined above, is the left-hand part of the potential term
        const right = this.parseFactor()

        if (!isSuccess(right)) {
          return right
        }

        termBinary = {
          type: "binary_op" as const,
          value: op.value,
          position: {
            start: term.value.position.start,
            end: right.value.position.end,
          },
          left: termBinary ? termBinary : term.value,
          right: right.value,
        }
      } else {
        // is op, but not mult or div
        break
      }
    }

    // Success state
    // (term is already a Result type so no need to wrap it)
    return termBinary ? success(termBinary) : term
  }

  private parseFactor(): Result<Node, ParseError> {
    const token = this.peek()

    // Expect any type of token.
    // Error path.
    // START_HERE: should we scrap UNEXPECTED_EOF and always return UNEXPECTED_TOKEN?
    // This would declutter this file a bit.
    if (token === null) {
      return this.createError({
        type: "UNEXPECTED_EOF",
        token: this.tokens[this.current - 1],
        expected: "factor",
      })
    }

    // Happy path.
    switch (token.type) {
      case "number":
        this.consume()

        return success({
          type: "number",
          value: token.value,
          position: token.position,
        })

      case "cell":
        this.consume()

        return success({
          type: "cell",
          value: token.value,
          position: token.position,
        })

      case "parens": {
        // Expect bracket.open
        if (token?.value === ")") {
          return this.createError({
            type: "PARENS",
            token: this.peek(),
            expected: "opening parenthesis",
          })
        }

        // Happy path.
        // Consume bracket.open and parse expression.
        this.consume()
        const expr = this.parseExpression()

        // Expect bracket.close
        if (this.peek()?.value !== ")") {
          return this.createError({
            type: "PARENS",
            token: this.peek(),
            expected: "closing parenthesis",
          })
        }

        // Happy path.
        // Consume closing bracket and return
        this.consume()
        return expr
      }

      case "func": {
        // Consume function keyword
        this.consume()

        // Expect bracket.open
        const next = this.peek()
        if (next === null) {
          return this.createError({
            type: "UNEXPECTED_EOF",
            token: this.tokens[this.current - 1],
            expected: "bracket after function keyword",
          })
        }

        if (next.value !== "(") {
          return this.createError({
            type: "PARENS",
            token: next,
            expected: "bracket after function keyword",
          })
        }

        // Happy path: consume bracket.
        this.consume()
        // Expect range.
        const range = this.parseRange()

        if (range.ok === false) {
          return range
        }

        // Happy path. Expect bracket.close
        if (this.peek()?.value !== ")") {
          return this.createError({
            type: "PARENS",
            token: this.peek()!,
            expected: "closing bracket of function expression",
          })
        }

        // Happy path: consume bracket.close and return
        this.consume()

        return success({
          type: "func",
          value: token.value,
          position: {
            start: token.position.start,
            end: range.value.to.position.end + 1,
          },
          ...range.value,
        })
      }

      // Unexpected token.type == something went seriously wrong in the tokenizer.
      // Unknown state, so we crash.
      default:
        throw new Error(
          `Parser received unknown token type: ${token.type}. This indicates a bug in the tokenizer.`,
        )
    }
  }

  // Function to parse range syntax, as in "SUM(A1:Z99)".
  // Happy path: the next sequence of tokens is <cell_ref>, ":", <cell_ref>
  private parseRange(): Result<{ from: Node_Cell; to: Node_Cell }, ParseError> {
    const maybeFirstCell = this.peek()

    // Happy path
    // Expect sequence `<cell_ref>, ":", <cell_ref>`
    if (maybeFirstCell?.type === "cell") {
      this.consume()
      if (this.peek()?.value === ":") {
        this.consume()
        if (this.peek()?.type === "cell") {
          const from = {
            type: "cell" as const,
            value: maybeFirstCell!.value,
            position: maybeFirstCell.position,
          }

          const to = {
            type: "cell" as const,
            value: this.peek()!.value,
            position: this.peek()!.position,
          }

          this.consume()

          return success({
            from,
            to,
          })
        }
      }
    }

    // Error path.
    // Did we run out of tokens?
    if (this.peek() === null) {
      return this.createError({
        type: "UNEXPECTED_EOF",
        token: this.tokens[this.current - 1],
        expected: "more tokens in range expression",
      })
    }

    // Token did not match range syntax
    return this.createError({
      type: "UNEXPECTED_TOKEN",
      token: this.peek(),
      expected: "valid range syntax",
    })
  }
}
