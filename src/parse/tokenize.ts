// =================================================
// TOKENIZER
// =================================================
//
// Takes string.
// Outputs a list of objects that
// is easier to work with.
//
// Example
// In: "11*(2+3)"
// Out (simplified): [{ value: "11"}, {value: "*"}, ...]
//
// NB: Fails fast -- Throws on the first error

import {
  isCellRef,
  isFunc,
  isNumber,
  isOp,
  isParens,
  isWhitespace,
} from "./match"
import { ParseError, Result, fail, success } from "./types/errors"
import { Token } from "./types/grammar"

export function tokenize(str: string): Result<Token[], ParseError> {
  const tokens = [] as Token[]

  let ind = 0

  while (ind < str.length) {
    // Ignore whitespace
    if (isWhitespace(str[ind])) {
      ind++
      continue
    }

    const result = getNextToken(ind, str)

    if (result.ok === true) {
      const token = result.value
      token.position.end = token.position.start + ind

      tokens.push(token)
      ind += token.value.length
    } else {
      // error state
      return result
    }
  }

  return success(tokens)

  function getNextToken(start: number, str: string): Result<Token, ParseError> {
    const token = createEmptyToken(ind)
    const char = str[start]

    if (isOp(char)) {
      token.type = "op"
      token.value = char
      return success(token)
    }

    if (isParens(char)) {
      token.type = "parens"
      token.value = char
      return success(token)
    }

    // Potentially a number or cell ref.
    // Lump all symbols together for simplicity. We differentiate below.
    const CHARS_NUM_OR_CELL = /[a-zA-Z0-9,.]/
    if (CHARS_NUM_OR_CELL.test(char)) {
      // Build up the token.
      let _ind = ind
      while (_ind < str.length) {
        const char = str[_ind]
        if (CHARS_NUM_OR_CELL.test(char)) {
          token.value += char
          _ind++
        } else {
          if (isOp(char)) {
            break
          }
          if (isParens(char)) {
            break
          }
          if (isWhitespace(char)) {
            _ind++
            continue
          }

          // Char is invalid
          // NOTE: START_HERE
          // Change this error type to INVALID_CHAR
          // And move on to return fail below, line 120
          return fail({
            type: "TOKEN",
            token,
            msg: `getNextToken: unknown token with value "${token.value}"`,
          })
        }
      }

      // Potential token has been collected and can be evaluated.
      if (isNumber(token.value)) {
        token.type = "number"
        return success(token)
      }
      if (isCellRef(token.value)) {
        token.type = "cell"
        return success(token)
      }
      if (isFunc(token.value)) {
        token.type = "func"
        return success(token)
      }

      // Invalid char or valid chars in wrong order.
      return fail({
        type: "TOKEN",
        token,
        msg: `getNextToken: unknown token with value "${token.value}"`,
      })
    }

    // Neither an op, a parens, a number, a cell, or a function keyword.
    return fail({
      type: "TOKEN",
      token,
      msg: `getNextToken: invalid char "${char}"`,
    })
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
      end: -1,
    },
    value: "",
    type: undefined,
  }
}
