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

import { isNumber } from "./match.ts";
import { Node_Binary, Node_Number, Token, Tree } from "./types/grammar.ts";

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

  parse(): Tree | null {
    const result = this.parseExpression()

    return result
  }

  private parseExpression(): Node_Binary | Node_Number | null  {
    let expr = this.parseTerm()

    if (expr === null ) {
      return null
    }

    while ( this.peek()?.type === 'op' ) {
      if ( this.peek()?.value === '+' ||  this.peek()?.value === '-' ) {
        const op = this.peek()?.value as string
        this.consume()

        const right = this.parseTerm()

        if ( right === null ) {
          return null
        }

        expr = {
          type: 'binary_op',
          value: op,
          left: expr,
          right: right
        }
      } else {
        break
      }
    }

    return expr
  }

  private parseTerm(): Node_Binary | Node_Number | null {
    let term = this.parseFactor()
    let termBinary = null

    if( term === null ) {
      return null
    }

    while ( this.peek()?.type === 'op' ) {
      if ( this.peek()?.value === '*' ||  this.peek()?.value === '/' ) {
        const op = this.peek()?.value as string
        this.consume()

        const right = this.parseFactor()

        if ( right === null ) {
          return null
        }

        termBinary = {
          type: 'binary_op' as const,
          value: op,
          left: termBinary ? termBinary : term,
          right: right
        }
      } else { 
        break
      }
    }

    return termBinary ? termBinary : term
  }

  private parseFactor(): Node_Number | null {
    const factor = this.peek()

    // end of the line
    // is this an error state?
    if( factor === null ) {
      return null
    }

    if( isNumber(factor.value) ) {
      this.consume()

      return ( {
        type: 'number',
        value: factor.value
      } )
    }
    // is it a cellref
    // smth smth error handling

    return null
  }
}

