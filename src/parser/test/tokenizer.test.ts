import {assert, describe, expect, it} from 'vitest'
import { tokenize } from '../tokenizer'

// =================================================
// TEST CASES
// =================================================
//
// # Valid formulae
const validExpression = "2+3"
//const validTerm = "2*3"
//const validExpressionWithTerm = "1+2*3"

// tokens.length === 11
const validSimple = "11+2*(3-4)/7"
// tokens.length === 11
const validWithCells = "11+2*(A1-B11)/7" 
//
// * Floating numbers
//      * using '.' or ','
//      * omitted 0 like 2+.5 = 2.5
// TODO:
// const validFloatsPeriod = "1.5 + 2 * 8.9"
//
// ### Edgecases
// * starts with negative number
// * a lot of unncessary whitespace 
const validWithWhitespace = "     11 +2*(A1-    B11)        / 7    " // * typos like doubled ops or invalid cell reference
//      -> Mark as error and perhaps suggest correction
//* single values: both literals and cell references. e.g. '=A5'
//      * also in brackets, like '=1+(2)
const singleValidValueSimple = '666'
const singleValidValueCell = 'A99'
//
// ## Invalid
// Types of errors:
// * Invalid char(s)
const invalidChars = "11^+2*(_3-}4)"
// * Invalid operation
// * Invalid operand
// * Invalid operand from cell reference
//    * i.e. A1 + A2 -> "cell 'A1' is not a number"
// * Invalid cell reference
//    * i.e. A999 + A2 -> "cell A999 does not exist"
//
// ### Syntax
// * Invalid bracket placement
//      * ())), )(, ()
// * Ill-formed node/expression/molecule
//      * ==, ++, etc.
//      * firstChar === non-minus op
//      * lastChar === any op

describe('tokenizer', () => {
  it('handles valid expression', () => {
    const result = tokenize(validExpression)

    assert(result.ok === true)
    expect(result.value.length).toBe(3)
  })

  it('handles valid all ops', () => {
    const result = tokenize(validSimple)

    assert(result.ok === true)
    expect(result.value.length).toBe(11)
  })
  
  it('handles valid all ops with cells', () => {
    const result = tokenize(validWithCells)

    assert(result.ok === true)
    expect(result.value.length).toBe(11)
  })

  // Edgecases
  it('handles single valid primitive value', () => {
    const result = tokenize(singleValidValueSimple)

    assert(result.ok === true)
    expect(result.value.length).toBe(1)
    expect(result.value[0].value).toBe("666")
  })
  
  it('handles single valid cell value', () => {
    const result = tokenize(singleValidValueCell)

    assert(result.ok === true)
    expect(result.value.length).toBe(1)
    expect(result.value[0].value).toBe("A99")
  })

  it('handles whitespace', () => {
    const result = tokenize(validWithWhitespace)

    assert(result.ok === true)
    expect(result.value.length).toBe(11)
    expect(result.value[0].value).toBe("11")
    expect(result.value[ result.value.length-1 ].value).toBe("7")
  })

  // INVALID

  it('invalid chars', () => {
    const result = tokenize(invalidChars)

    assert(result.ok === false)
    expect(result.error).toBe("token")
  })
  //it('handles whitespace', () => {
  //  const result = atomize('=      2   +9   ')
  //
  //  expect(result.errors).toHaveLength(0)
  //})
})


