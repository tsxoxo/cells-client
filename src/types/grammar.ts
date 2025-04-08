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
  position?: {
    start: number,
    end: number
  },
}

export type Node_Expr = {
  type: 'binary_op',
  left: Token,
  right: Token,
}

// Not sure if I need this
//type Node = {
//  value: number,
//  left: number,
//  right: number,
//  op: typeof ops 
//}
