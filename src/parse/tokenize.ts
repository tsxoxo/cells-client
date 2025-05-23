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

const ALPHANUM = /[a-zA-Z0-9]/

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

    // Is it a number?
    const CHARS_NUM = /[0-9,.]/
    if (CHARS_NUM.test(char)) {
      // Build up the token.
      let _ind = ind
      while (_ind < str.length) {
        const char = str[_ind]
        if (CHARS_NUM.test(char)) {
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

          // Unexpected char.
          // Lump together invalid chars and letters, for now.
          // Exampes: "3a", "5$"
          // Add faulty char for error handling.
          token.value += char
          return fail({
            type: "INVALID_NUMBER",
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

      // Number-like chars but an invalid pattern.
      // Examples: "12,3.", "."
      // We throw the same error as above
      // Add faulty char for error handling.
      token.value += char
      return fail({
        type: "INVALID_NUMBER",
        token,
        msg: `getNextToken: unknown token with value "${token.value}"`,
      })
    }

    if (ALPHANUM.test(char)) {
      return parseAlphaNumeric(ind, token, str)
    }

    // Neither an op, a parens, a number, a cell, or a function keyword.
    return fail({
      type: "INVALID_CHAR",
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

// Parses potential cell refs and function names.
// Merrily accrues all valid chars.
// Validation happens separately.
function parseAlphaNumeric(
  ind: number,
  token: Token,
  str: string,
): Result<Token, ParseError> {
  let _ind = ind
  // We already know the first char is alphanumeric
  token.value += str[_ind]
  _ind++

  while (_ind < str.length) {
    const char = str[_ind]
    if (ALPHANUM.test(char)) {
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

      if (!ALPHANUM.test(char)) {
        // Unexpected char.
        // Catch both "A_" and "AA"
        // Add to token for error handling
        token.value += char
        return fail({
          type: "INVALID_CELL",
          token,
          msg: `getNextToken: unknown token with value "${token.value}"`,
        })
      }
    }
  }

  // Potential token has been collected and can be evaluated.
  return validateToken(token)
}

function validateToken(token: Token): Result<Token, ParseError> {
  // HAPPY STATES
  if (isCellRef(token.value)) {
    token.type = "cell"
    return success(token)
  }
  if (isFunc(token.value)) {
    token.type = "func"
    return success(token)
  }

  // ERRORS
  // Differentiate between malformed cell refs and unknown func names
  // Example: "a999" vs "foo"
  if (/^[a-zA-Z]{1}[0-9]+/.test(token.value)) {
    return fail({
      type: "INVALID_CELL",
      token,
      msg: `getNextToken: unknown token with value "${token.value}"`,
    })
  }
  if (/^[a-zA-Z]+/.test(token.value)) {
    return fail({
      type: "UNKNOWN_FUNCTION",
      token,
      msg: `getNextToken: unknown token with value "${token.value}"`,
    })
  }

  // Safety net. Not sure if we ever hit this.
  // Possibly, crash here?
  return fail({
    type: "UNKNOWN_ERROR",
    token,
    msg: `getNextToken: unknown token with value "${token.value}"`,
  })
}
