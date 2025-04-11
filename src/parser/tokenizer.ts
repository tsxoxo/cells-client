// =================================================
// TOKENIZER
// =================================================
//
// Takes raw string.
// Outputs a list of objects that
// is easier to work with.
//
// Example
// In: "11*(2+3)"
// Out (simplified): [{ value: "11"}, {value: "*"}, ...]

import { isCellRef, isNumber, isOp, isParens } from "./matchers"
import { Result, fail, success } from "./types/errors"
import { Token } from "./types/grammar"

export function tokenize(rawInput: string): Result<Token[]> {
  const tokens = [] as Token[]

  let ind = 0
  
  while( ind < rawInput.length ) {
    const result =  getNextToken( ind )
    //console.log(result)
    if( result.ok === true ) {
      tokens.push(result.value)
    } else {
      // error state
      return result
    }
  }

  return success( tokens )

  function getNextToken(start: number): Result<Token> {
    const token = createEmptyToken(ind)
    const char = rawInput[start]

    if( isOp(char) ) {
      token.type = "op"
      token.value = char
      // TODO: start + 1?
      token.position.end = start
      ind++
      return success(token)
    }
    if( isParens(char) ) {
      token.type = "parens"
      token.value = char
      // TODO: start + 1?
      token.position.end = start
      ind++
      return success(token)
    }
    if( /[a-zA-Z0-9,\.]/.test(char) ) {
      token.value = char
      ind++

      while( ind < rawInput.length ) {
        const char = rawInput[ind]

        // NOTE: This seems redundant.
        // "Simplify" with recursion?
        if( isOp(char)) {
          break
        }
        if( isParens(char)) {
          break
        }
        if( /[a-zA-Z0-9,\.]/.test(char) ) {
          token.value += char
          ind++
          continue
        } 
        
        // invalid char
        return fail(`char`)
      }
      
      // Potential token has been collected
      // and can be evaluated.
      if( isNumber(token.value) ) {
        token.type = "number"
        token.position.end = ind
        return success(token)
      }
      if( isCellRef(token.value) ) {
        token.type = "cell"
        token.position.end = ind
        return success(token)
      }
      // TODO: isFormula

      
      // Error: invalid structure 
      // (Valid chars in wrong order)
      return fail(`structure`)
    }

    // Error: Invalid char
    // (Neither an op, nor a parens, nor a number or a cell)
    return fail( 'char' )
  }
}

// =================================================
// UTILS
// =================================================
// Factory
function createEmptyToken(start: number): Token {
  // Initialize with start pos and dummy values.
  return {
    position: {
      start: start,
      end: -1 
    },
    value: "",
    type: undefined
  };
}

