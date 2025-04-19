// =================================================
// PARSER
// =================================================
//
// Takes an array of tokens,
// outputs a tree structure.
//
// Uses the following grammar:
//
// * expression ::= term (('+' | '-') term)*
// * term ::= factor (('*' | '/') factor)*
// * factor ::= number | cell | '(' expression ')'
// * number ::= [0-9]+ (( ',' | '.' ) [0-9]+)?
// * cell ::= [a-zA-Z][0-9][0-9]?

import { ParseError, Result, fail, isSuccess, success } from "./types/errors.ts"
import { Token, Tree } from "./types/grammar.ts"

export class Parser {
  readonly tokens: Token[]
  current: number

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.current = 0
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

  makeAST(): Result<Tree, ParseError> {
    const result = this.parseExpression()

    return result
  }

  private parseExpression(): Result<Tree, ParseError> {
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
          left: exprBinary ? exprBinary : expr.value,
          right: right.value,
        }
      } else {
        break
      }
    }

    return exprBinary ? success(exprBinary) : expr
  }

  private parseTerm(): Result<Tree, ParseError> {
    const term = this.parseFactor()
    let termBinary = null

    if (!isSuccess(term)) {
      return term
    }

    while (this.peek()?.type === "op") {
      const token = this.peek()
      if (token?.value === "*" || token?.value === "/") {
        const op = token?.value as string
        this.consume()

        const right = this.parseFactor()

        if (!isSuccess(right)) {
          return right
        }

        termBinary = {
          type: "binary_op" as const,
          value: op,
          left: termBinary ? termBinary : term.value,
          right: right.value,
        }
      } else {
        break
      }
    }

    return termBinary ? success(termBinary) : term
  }

  private parseFactor(): Result<Tree, ParseError> {
    const token = this.peek()

    // end of the line
    if (token === null) {
      return fail({
        type: "UNEXPECTED_EOF",
        token,
        msg: "parseFactor: expected something after an operator",
      })
    }

    switch (token.type) {
      case "number":
        this.consume()

        return success({
          type: "number",
          value: token.value,
        })

      case "cell":
        this.consume()

        return success({
          type: "cell",
          value: token.value,
        })

      case "parens":
        if (token?.value === "(") {
          this.consume()
          const expr = this.parseExpression()

          if (this.peek()?.value !== ")") {
            return fail({
              type: "PARENS",
              token: this.peek(),
              msg: "parseFactor: Expected closing bracket",
            })
          }

          this.consume()

          return expr
        } else {
          return fail({
            type: "PARENS",
            token: this.peek(),
            msg: "parseFactor: Unexpected opening bracket",
          })
        }

      case "func": {
        this.consume()

        const next = this.peek()
        if (next === null) {
          return fail({
            type: "UNEXPECTED_EOF",
            token: null,
            msg: "parseFactor: unexpected end of input after function keyword.",
          })
        }

        if (next.value !== "(") {
          return fail({
            type: "PARENS",
            token: next,
            msg: "parseFactor: Expected opening bracket after function keyword",
          })
        }

        // Happy path: is a bracket. Try to parse range.
        this.consume()
        const range = this.parseRange()

        if (range.ok === false) {
          return range
        }

        if (this.peek()?.value !== ")") {
          return fail({
            type: "PARENS",
            token: this.peek()!,
            msg: "parseFactor: Expected closing bracket after function keyword",
          })
        }

        // happy path: consume the closing bracket
        this.consume()

        return success({
          type: "func",
          value: token.value,
          ...range.value,
        })
      }
    }
    // After case block
    return fail({
      type: "TOKEN",
      token,
      msg: "unknown type of token",
    })
  }

  private parseRange(): Result<{ from: string; to: string }, ParseError> {
    const token = this.peek()

    if (token === null) {
      return fail({
        type: "UNEXPECTED_EOF",
        token: null,
        msg: "parseRange: Unexpected end of input in function",
      })
    }

    // Happy path
    // TODO: Prob refactor: move error to the top. unnest
    if (token.type === "cell") {
      this.consume()
      if (this.peek()?.value === ":") {
        this.consume()
        const maybeCell = this.peek()
        if (maybeCell?.type === "cell") {
          this.consume()
          return success({
            from: token!.value,
            to: maybeCell.value,
          })
        }
      }
    }

    return fail({
      type: "TOKEN",
      msg: "Could not parse range: Unexpected token in function",
      token: this.peek(),
    })
  }
}
