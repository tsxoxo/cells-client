import { isNumber } from "./matchers.ts";
import { Err_InvalidChar } from "./types/errors.ts";
import { Node_Binary, Token } from "./types/grammar.ts";

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

export class Parser {
  tokens: Token[]
  current: number

  constructor (tokens: Token[]) {
    this.tokens = tokens
    this.current = 0
  }

  peek() {
    if( this.current >= this.tokens.length ) { return null }
    return this.tokens[this.current]
  }

  consume() {
    if( this.current >= this.tokens.length ) { return null }
    this.current++
    return this.tokens[this.current - 1]
  }

  parse(): Node_Binary | Token | null {
    return this.parseExpression()
  }

  parseExpression(): Node_Binary | Token | null  {
    let expr = this.parseTerm()

    if (expr === null ) {
      return null
    }

    // How to loop?
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
          op: op,
          left: expr,
          right: right
        }
      } else {
        break
      }
    }

    return expr
  }

  parseTerm(): Node_Binary | Token | null {
    let term = this.parseFactor()

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

        term = {
          type: 'binary_op',
          op: op,
          left: term,
          right: right
        }
      } else { 
      break
      }
    }

    return term
  }

  parseFactor(): Token | null {
    const factor = this.peek()

    // end of the line
    // is this an error state?
    if( factor === null ) {
      return null
    }

    if( isNumber(factor.value) ) {
      
      return this.consume()
    }
    // is it a cellref
    // smth smth error handling

    return null
  }
}

