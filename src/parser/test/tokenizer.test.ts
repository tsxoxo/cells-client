import {describe, expect, it} from 'vitest'
import { tokenize } from '../tokenizer'

// =================================================
// TEST CASES
// =================================================
//
// # Valid formulae
const validExpression = "2+3"
//const validTerm = "2*3"
//const validExpressionWithTerm = "1+2*3"

// * Buffet simple: 11+2*(3-4)/7
const validSimple = "11+2*(3-4)/7"
// * Buffet with cell reference: 11+2*(A1-B11)/7
const validWithCells = "11+2*(A1-B11)/7" 
//
// * Floating numbers
//      * using '.' or ','
//      * omitted 0 like 2+.5 = 2.5
// TODO:
//const validFloatsPeriod = "1.5 + 2 * 8.9"
//
// ### Edgecases
// * starts with negative number
// * a lot of unncessary whitespace 
//      -> reduce to state without whitespace
//      OR let user decide
// * typos like doubled ops or invalid cell reference
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

    expect(result.tokens.length).toBe(3)
    expect(result.errors.length).toBe(0)
  })

  it('handles valid all ops', () => {
    const result = tokenize(validSimple)

    expect(result.tokens.length).toBe(11)
    expect(result.errors.length).toBe(0)
  })
  
  it('handles valid all ops with cells', () => {
    const result = tokenize(validWithCells)

    expect(result.tokens.length).toBe(11)
    expect(result.errors.length).toBe(0)
  })

  // Edgecases
  it('handles single valid primitive value', () => {
    const result = tokenize(singleValidValueSimple)

    expect(result.tokens.length).toBe(1)
    expect(result.errors.length).toBe(0)
  })
  
  it('handles single valid cell value', () => {
    const result = tokenize(singleValidValueCell)

    expect(result.tokens.length).toBe(1)
    expect(result.errors.length).toBe(0)
  })

  // INVALID

  it('invalid chars', () => {
    const result = tokenize(invalidChars)

    expect(result.tokens.length).toBe(9)
    expect(result.errors.length).toBe(3)
  })
  //it('handles whitespace', () => {
  //  const result = atomize('=      2   +9   ')
  //
  //  expect(result.errors).toHaveLength(0)
  //})
})


