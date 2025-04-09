import { Err_Parsing, Err_InvalidChar, Err_InvalidSyntax } from "./types/errors.ts";
import { ALLOWED_SYMBOLS, Node_Binary, Token } from "./types/grammar.ts";

// TODO: Not sure if I need this
// RESULT TYPES
// Probably simplify this
type Res_FirstPass = {
  errors: Err_InvalidChar[],
  atoms: Token[]
}
//type Res_SecondPass = {
//  errors: Err_InvalidSyntax[],
//  nodes: Node[]
//}
//type Res_Parsing = {
//  err: Err_Parsing,
//  node: Node
//}

// =================================================
// # IMPLEMENTATION
// =================================================
//

// GRAMMAR CHEATSHEET
// * expression ::= term (('+' | '-') term)*
// * term ::= factor (('*' | '/') factor)*
// * factor ::= number | cell | '(' expression ')'
// * number ::= [0-9]+ (( ',' | '.' ) [0-9]+)?
// * cell ::= [a-zA-Z][0-9][0-9]?

export class Parser {
  tokens: Token[]
  current: number

  constructor (tokens: Token[]) {
    this.tokens = tokens
    this.current = 0
  }

  peek() {
    if( this.current >= this.tokens.length ) { return null }
    return this.tokens[this.current]
  }

  consume() {
    if( this.current >= this.tokens.length ) { return null }
    this.current++
    return this.tokens[this.current - 1]
  }

  parse(): Node_Binary | Token | null {
    return this.parseExpression()
  }

  parseExpression(): Node_Binary | Token | null  {
    let expr = this.parseTerm()

    if (expr === null ) {
      return null
    }

    // How to loop?
    while ( this.peek()?.type === 'op' ) {
      if ( this.peek()?.value === '+' ||  this.peek()?.value === '-' ) {
        const op = this.peek()?.value as string
        this.consume()

        const right = this.parseTerm()

        if ( right === null ) {
          return null
        }

        expr = {
          type: 'binary_op',
          op: op,
          left: expr,
          right: right
        }
      } else {
        break
      }
    }

    return expr
  }

  parseTerm(): Node_Binary | Token | null {
    let term = this.parseFactor()

    if( term === null ) {
      return null
    }

    while ( this.peek()?.type === 'op' ) {
      if ( this.peek()?.value === '*' ||  this.peek()?.value === '/' ) {
        const op = this.peek()?.value as string
        this.consume()

        const right = this.parseFactor()

        if ( right === null ) {
          return null
        }

        term = {
          type: 'binary_op',
          op: op,
          left: term,
          right: right
        }
      } else { 
      break
      }
    }

    return term
  }

  parseFactor(): Token | null {
    const factor = this.peek()

    // end of the line
    // is this an error state?
    if( factor === null ) {
      return null
    }

    if( isNumber(factor.value) ) {
      
      return this.consume()
    }
    // is it a cellref
    // smth smth error handling

    return null
  }
}

// =================================================
// UTILS
// =================================================
//function isNumber(str: string) {
//  return !isNaN(Number(str))
//}
// * Number: /[0-9]+((,|\.)[0-9]+)?/
// * Cell_ref: /[a-zA-Z]{1}[0-9]{1,2}/
function isNumber(tokenValue: string): boolean {
  // Include float input using "," and "."
  // TODO: Edgecases like "1.0000000000"
  return /[0-9]+((,|\.)[0-9]+)?/.test(tokenValue)
}

function isCellRef(tokenValue: string): boolean {
  // Allow both "A1" and "A01"
  return /[a-zA-Z]{1}[0-9]{1,2}/.test(tokenValue)
}

function isValidValue(char: string): boolean {
  return /[a-zA-Z0-9\.\,]/.test(char)
}
function createEmptyAtom(start: number): Token {
  return {
    position: {
      start: start,
      end: -1 // Will be filled in later
    },
    value: "",
    type: undefined
  };
}

// Not sure if I need this
//export function makeNodes(atoms: Token[]): Res_SecondPass {
//  const nodes = [] as Node[]
//  const errors = [] as Err_InvalidSyntax[]
//
//  for (let ind = 0; ind < atoms.length; ind++) {
//    const atom = atoms[ind];
//
//    if( atom.type === 'value' ) {
//      // makeNode()?
//
//    }
//  }
//
//  return {
//    nodes,
//    errors
//  }
//}

// =================================================
// PARSING FUNCTIONS
// =================================================
//
// 1. tokenize()
// Takes raw string.
// Outputs a list of objects that
// is easier to work with.
//
// Example
// In: "11*(2+3)"
// Out(approximation): {tokens: [{value: 11, position: {...}, ...}, ...], errors: []}
export function tokenize(rawInput: string): Res_FirstPass {
  const atoms = [] as Token[]
  const errors = [] as Err_InvalidChar[]

  for(let ind = 0; ind < rawInput.length; ind++) {
    // if it's anything else (ideally, numbers, points for floats and cell references)
    // keep going until an op and add that whole chunk as an atom
    if(isValidValue(rawInput[ind])) {
      const atom = createEmptyAtom(ind)

      while(isValidValue(rawInput[ind])) {
        if( ind < rawInput.length ) {
          ind++
        } else {
          break
        }
      }
      // Outside of the while loop so it's not a valid *value* char.
      // We take the hunk we have accumulated so far.
      atom.position.end = ind
      atom.type = 'value'
      atom.value = rawInput.substring(atom.position.start, atom.position.end)
      //atom.value = parseFloat(atom.value)

      atoms.push(atom)

      // After that, we are on a new index so we 
      // continue with the iteration
      // instead of using continue ;)
    }

    // if it's a bracket, add char to atoms
    if(ALLOWED_SYMBOLS.brackets.includes(rawInput[ind])) {
      const atom = createEmptyAtom(ind)

      atom.position.end = ind + 1
      atom.type = 'brack'
      atom.value = rawInput[ind]

      atoms.push(atom)

      continue
    }

    // if it's an op, add char to atoms
    if(ALLOWED_SYMBOLS.ops.includes(rawInput[ind])) {
      const atom = createEmptyAtom(ind)

      atom.position.end = ind + 1
      atom.type = 'op'
      atom.value = rawInput[ind]

      atoms.push(atom)

      continue
    }

    if( ind < rawInput.length ) {
      // Must be an invalid character.
      errors.push({
        char: rawInput[ind],
        charIndex: ind,
        msg: `Invalid character ${rawInput[ind]} at ${ind}`,
      })
    }
  }

  //console.log(errors)
  //console.log(atoms)
  return {
    atoms,
    errors
  }
}



