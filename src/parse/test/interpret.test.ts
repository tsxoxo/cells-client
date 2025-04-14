import { assert, describe, expect, it } from "vitest";
import { interpreter } from "../interpret";

// =================================================
// # TEST DATA
// =================================================

// "2+3"
const validExpressionTree = { type: 'binary_op', value: '+', left: { type: 'number', value: '2' }, right: { type: 'number', value: '3' } } as const

// "2*3"
const validTermTree = { type: 'binary_op', value: '*', left: { type: 'number', value: '2' }, right: { type: 'number', value: '3' } } as const

// "1+2*3"
const validExpressionWithTermTree = { 
  type: 'binary_op', 
  value: '+', 
  left: { type: 'number', value: '1' }, 
  right: { 
    type: 'binary_op', 
    value: '*', 
    left: { type: 'number', value: '2' }, 
    right: { type: 'number', value: '3' } 
  } 
} as const

describe('Interpreter', () => {
  it('does number arithmetics no brackets', () => {
    let result = interpreter(validExpressionTree)
    assert(result.ok === true)
    expect(result.value).toEqual(5)

    result = interpreter(validTermTree)
    assert(result.ok === true)
    expect(result.value).toEqual(6)

    result = interpreter(validExpressionWithTermTree)
    assert(result.ok === true)
    expect(result.value).toEqual(7)
  })
})

