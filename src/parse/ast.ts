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

import { Result, fail, isSuccess, success } from "./types/errors.ts";
import { Token, Tree } from "./types/grammar.ts";

export class Parser {
  readonly tokens: Token[]
  current: number

  constructor (tokens: Token[]) {
    this.tokens = tokens
    this.current = 0
  }

  private peek() {
    if( this.current >= this.tokens.length ) { return null }
    return this.tokens[this.current]
  }

  private consume() {
    if( this.current >= this.tokens.length ) { return null }
    this.current++
    return this.tokens[this.current - 1]
  }

  makeAST(): Result<Tree> {
    const result = this.parseExpression()

    return result
  }

  private parseExpression(): Result<Tree>  {
    let expr = this.parseTerm()
    let exprBinary = null

    if (!isSuccess(expr)) {
      return expr
    }

    while ( this.peek()?.type === 'op' ) {
      if ( this.peek()?.value === '+' ||  this.peek()?.value === '-' ) {
        const op = this.peek()?.value as string
        this.consume()

        const right = this.parseTerm()

        if (!isSuccess(right)) {
          return right
        }

        exprBinary = {
          type: 'binary_op' as const,
          value: op,
          left: exprBinary ? exprBinary : expr.value,
          right: right.value
        }
      } else {
        break
      }
    }

    return exprBinary ? success(exprBinary) : expr
  }

  private parseTerm(): Result<Tree> {
    let term = this.parseFactor()
    let termBinary = null

    if(!isSuccess(term)){ 
      return term
    }

    while ( this.peek()?.type === 'op' ) {
      if ( this.peek()?.value === '*' ||  this.peek()?.value === '/' ) {
        const op = this.peek()?.value as string
        this.consume()

        const right = this.parseFactor()

        if (!isSuccess(right)) {
          return right
        }

        termBinary = {
          type: 'binary_op' as const,
          value: op,
          left: termBinary ? termBinary : term.value,
          right: right.value
        }
      } else { 
        break
      }
    }

    // getting a type error here
    return termBinary ? success(termBinary) : term
  }

  private parseFactor(): Result<Tree> {
    const factor = this.peek()

    // end of the line
    if( factor === null ) {
      return fail('UNEXPECTED_EOF')
    }

    if( factor.type === "number") {
      this.consume()

      return success({
        type: 'number',
        value: factor.value
      })
    }

    if( factor.type === "cell") {
      this.consume()

      return success({
        type: 'cell',
        value: factor.value
      })
    }

    // Can't parse token
    //console.log('cant parse token in parsefactor')
    return fail('TOKEN')
  }
}

