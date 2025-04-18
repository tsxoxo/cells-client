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
      return fail({ type: "UNEXPECTED_EOF" })
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
              position: this.current,
              info: "parseFactor: Expected closing bracket",
            })
          }

          this.consume()
          return expr
        }
        break

      default:
        return fail({ type: "TOKEN", info: "unknown type of token" })
    }
  }
}
