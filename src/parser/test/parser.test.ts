import { describe, expect, it } from "vitest";
import { Parser } from "../parser";
import { Token } from "../types/grammar";

const validExpressionTokens = [{ type: 'value', value: '2' }, { type: 'op', value: '+' }, { type: 'value', value: '3' }] as Token[]
const validExpressionTree = { type: 'binary_op', op: '+', left: { type: 'value', value: '2' }, right: { type: 'value', value: '3' } }

//const validTerm = "2*3"
const validTermTokens = [{ type: 'value', value: '2' }, { type: 'op', value: '*' }, { type: 'value', value: '3' }] as Token[]
const validTermTree = { type: 'binary_op', op: '*', left: { type: 'value', value: '2' }, right: { type: 'value', value: '3' } }

//const validExpressionWithTerm = "1+2*3"
const validExpressionWithTermTokens = [{ type: 'value', value: '1' }, { type: 'op', value: '+' }, { type: 'value', value: '2' }, { type: 'op', value: '*' }, { type: 'value', value: '3' }] as Token[]
const validExpressionWithTermTree = { type: 'binary_op', op: '*', left: { type: 'value', value: '2' }, right: { type: 'value', value: '3' } }

describe('Parser', () => {
  it('parses expression', () => {
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
