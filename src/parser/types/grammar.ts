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
  type: 'value' | 'op' | 'brack' | undefined,
  // position optional to simplify testing.
  // TODO: think of a better way cuz this is producing warning spam.
  position?: {
    start: number,
    end: number
  },
}

export type Tree = Node_Binary | Node_Number | Node_Cell

export type Node_Binary = {
  type: 'binary_op',
  // ['+', '-', '*', '/'],
  value: string,
  left: Node_Binary | Node_Number | Node_Cell,
  right: Node_Binary | Node_Number | Node_Cell,
}

export type Node_Number = {
  type: 'number',
  value: string,
}

export type Node_Cell = {
  type: 'cell',
  value: string,
}

