// =================================================
// # GRAMMAR
// =================================================
//
// * expression ::= term (('+' | '-') term)*
// * term ::= factor (('*' | '/') factor)*
// * factor ::= number | cell | '(' expression ')'
// * number ::= [0-9]+ (( ',' | '.' ) [0-9]+)?
// * cell ::= [a-zA-Z][0-9][0-9]?
// TODO: Add negation, formulae
//
// ## RegEx
// * Bracket: /[\(\)]*/
// * Operator: /[+-\/\*]{1}/
// * Number: /[0-9]+((,|\.)[0-9]+)?/
// * Cell_ref: /[a-zA-Z]{1}[0-9]{1,2}
 
export const ALLOWED_SYMBOLS = {
  ops: ['+', '-', '*', '/'],
  nums: ['1', '2', '.', ','],
  brackets: ['(', ')'],
  // and cell references...
}

export type Token = {
  value: string, 
  //type: 'value' | 'op' | 'brack' | undefined,
  type: string,
  position: {
    start: number,
    end: number
  },
}

export type Tree = Node_Binary | Node_Number | Node_Cell

interface Node_Base {
  type: string
  value: string
}

export interface Node_Binary extends Node_Base {
  type: 'binary_op',
  // ['+', '-', '*', '/'],
  left: Node_Binary | Node_Number | Node_Cell,
  right: Node_Binary | Node_Number | Node_Cell,
}

export interface Node_Number extends Node_Base  {
  type: 'number',
}

export interface Node_Cell extends Node_Base  {
  type: 'cell',
}

