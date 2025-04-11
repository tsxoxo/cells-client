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

    if( result.ok === true ) {
      const token = result.value
      token.position.end = token.position.start + ind

      tokens.push(token)
      ind += token.value.length
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
      return success(token)
    }

    if( isParens(char) ) {
      token.type = "parens"
      token.value = char
      return success(token)
    }

    // Lump all other valid symbols together for simplicity. We differentiate below.
    if( /[a-zA-Z0-9,\.]/.test(char) ) {
      let _ind = ind
      while( _ind < rawInput.length ) {
        if( /[a-zA-Z0-9,\.]/.test(rawInput[_ind]) ) {
          token.value += rawInput[_ind]
          _ind++
        } else {
          break
        }
      }
      
      // Potential token has been collected and can be evaluated.
      if( isNumber(token.value) ) {
        token.type = "number"
        return success(token)
      }
      if( isCellRef(token.value) ) {
        token.type = "cell"
        return success(token)
      }
      // TODO: isFormula
      
      // Invalid char or valid chars in wrong order.
      return fail( "token" )
    }

    // Neither an op, nor a parens, nor a number or a cell.
    return fail( "token" )
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

