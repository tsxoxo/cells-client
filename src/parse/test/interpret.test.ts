import { assert, describe, expect, it } from "vitest";
import { interpret } from "../interpret";

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

// "A0*a01"
const validWithCells = {
  type: 'binary_op',
  value: '*', 
  left: { type: 'cell', value: 'A0' }, 
  right: { type: 'cell', value: 'a01' }
} as const

describe('Interpreter', () => {
  it('does number arithmetics no brackets', () => {
    let result = interpret(validExpressionTree)
    assert(result.ok === true)
    expect(result.value.formulaResult).toEqual(5)

    result = interpret(validTermTree)
    assert(result.ok === true)
    expect(result.value.formulaResult).toEqual(6)

    result = interpret(validExpressionWithTermTree)
    assert(result.ok === true)
    expect(result.value.formulaResult).toEqual(7)
  })

  it('extracts dependencies', () => {
    let result = interpret(validWithCells)
    assert(result.ok === true)
    expect(result.value.deps).toEqual([0, 1])
  })
})

