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

    // end of the line
    if (token === null) {
      return this.createError({
        type: "UNEXPECTED_EOF",
        token,
        expected: "factor",
      })
    }

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

      case "parens":
        if (token?.value === "(") {
          this.consume()
          const expr = this.parseExpression()

          if (this.peek()?.value !== ")") {
            return this.createError({
              type: "PARENS",
              token: this.peek(),
              expected: "closing parenthesis",
            })
          }

          this.consume()

          return expr
        } else {
          // I guess we can hit this in theory if the tokenizer mislabels something else as 'parens'
          return this.createError({
            type: "UNKNOWN_ERROR",
            token: this.peek(),
            expected: "opening bracket",
          })
        }

      case "func": {
        // Advance to the next token
        this.consume()

        const next = this.peek()
        if (next === null) {
          return this.createError({
            type: "UNEXPECTED_EOF",
            token: token,
            expected: "bracket after function keyword",
          })
        }

        if (next.value !== "(") {
          return this.createError({
            type: "UNEXPECTED_TOKEN",
            token: next,
            expected: "bracket after function keyword",
          })
        }

        // Happy path: is a bracket. Try to parse range.
        this.consume()
        const range = this.parseRange()

        if (range.ok === false) {
          return range
        }

        if (this.peek()?.value !== ")") {
          return this.createError({
            type: "PARENS",
            token: this.peek()!,
            expected: "closing bracket of function expression",
          })
        }

        // happy path: consume the closing bracket
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
    }

    // After switch(token.type) block
    // == token was not anything we expected
    return this.createError({
      type: "UNEXPECTED_TOKEN",
      token,
      expected: "any known factor",
    })
  }

  private parseRange(): Result<{ from: Node_Cell; to: Node_Cell }, ParseError> {
    const maybeFirstCell = this.peek()

    // Happy path
    // HACK:
    // Seems wrong to nest but I cant be bothered right now
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
