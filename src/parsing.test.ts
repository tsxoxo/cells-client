import {describe, expect, it} from 'vitest'
import {Parser, tokenize} from './parsing'
import { Token } from './types/grammar'

// =================================================
// TEST CASES
// =================================================
//
// # Valid formulae
const validExpression = "2+3"
const validExpressionTokens = [{ type: 'value', value: '2' }, { type: 'op', value: '+' }, { type: 'value', value: '3' }] as Token[]
const validExpressionTree = { type: 'binary_op', op: '+', left: { type: 'value', value: '2' }, right: { type: 'value', value: '3' } }

const validTerm = "2*3"
const validTermTokens = [{ type: 'value', value: '2' }, { type: 'op', value: '*' }, { type: 'value', value: '3' }] as Token[]
const validTermTree = { type: 'binary_op', op: '*', left: { type: 'value', value: '2' }, right: { type: 'value', value: '3' } }

const validExpressionWithTerm = "1+2*3"
const validExpressionWithTermTokens = [{ type: 'value', value: '1' }, { type: 'op', value: '+' }, { type: 'value', value: '2' }, { type: 'op', value: '*' }, { type: 'value', value: '3' }] as Token[]
const validExpressionWithTermTree = { type: 'binary_op', op: '*', left: { type: 'value', value: '2' }, right: { type: 'value', value: '3' } }

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

    expect(result.atoms.length).toBe(3)
    expect(result.errors.length).toBe(0)
  })

  it('handles valid all ops', () => {
    const result = tokenize(validSimple)

    expect(result.atoms.length).toBe(11)
    expect(result.errors.length).toBe(0)
  })
  
  it('handles valid all ops with cells', () => {
    const result = tokenize(validWithCells)

    expect(result.atoms.length).toBe(11)
    expect(result.errors.length).toBe(0)
  })

  // Edgecases
  it('handles single valid primitive value', () => {
    const result = tokenize(singleValidValueSimple)

    expect(result.atoms.length).toBe(1)
    expect(result.errors.length).toBe(0)
  })
  
  it('handles single valid cell value', () => {
    const result = tokenize(singleValidValueCell)

    expect(result.atoms.length).toBe(1)
    expect(result.errors.length).toBe(0)
  })

  // INVALID

  it('invalid chars', () => {
    const result = tokenize(invalidChars)

    expect(result.atoms.length).toBe(9)
    expect(result.errors.length).toBe(3)
  })
  //it('handles whitespace', () => {
  //  const result = atomize('=      2   +9   ')
  //
  //  expect(result.errors).toHaveLength(0)
  //})
})


describe('Parser class', () => {
  it('parses expression', () => {
    console.log('hey');
    const parser = new Parser(validExpressionTokens)
    
    expect(parser.parse()).toEqual(validExpressionTree)
  })

  it('parses term', () => {
    const parser = new Parser(validTermTokens)
    expect(parser.parse()).toEqual(validTermTree)
  })

  it('parses expression with term', () => {
    const parser = new Parser(validExpressionWithTermTokens)
    const tree = parser.parse()
    expect(tree.left.value).toEqual("1")
    expect(tree.op).toEqual("+")
    expect(tree.right.type).toEqual("binary_op")
    expect(tree.right.op).toEqual("*")
  })
})
