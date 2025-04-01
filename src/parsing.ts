// Make errors granular so that they can be signaled.
//
// Necessary data:
// * type of error -> error msg
// * start and end position of invalid token -> marking
//    * mb reference to node
//
// Types of errors:
// * Invalid operation
// * Invalid operand
// * Invalid operand from cell reference
//    * i.e. A1 + A2 -> "cell 'A1' is not a number"
// * Invalid cell reference
//    * i.e. A999 + A2 -> "cell A999 does not exist"
// * Invalid bracket placement
type Err_InvalidChar = {
  char: string,
  charIndex: number,
  msg: string
}
type Err_InvalidSyntax = {
  node: string,
  nodeIndex: number,
  msg: string
}
type Err_Parsing = {
  nodeRaw: string,
  nodeIndex: number,
  msg: string
}
// # GRAMMAR
//
// ## First try
// * expression ::= term ('+' | '-') term | term
// * term ::= factor ('*' | '/') factor | factor
// * factor ::= number | cell | '(' expression ')'
// * number ::= [0-9]+
// * cel ::= [a-zA-Z][0-9][0-9]?
//
// ## Second try
// * expression ::= term (('+' | '-') term)*
// * term ::= factor (('*' | '/') factor)*
// * factor ::= number | cell | '(' expression ')'
// * number ::= [0-9]+
// * cell ::= [a-zA-Z][0-9][0-9]?
//
// ## RegEx
// * Bracket: /[\(\)]*/
// * Operator: /[+-\/\*]{1}/
//      * Actually, '-' is both infix and prefix
// * Number: /[0-9]+((,|\.)[0-9]+)?/
// * Cell_ref: /[a-zA-Z]{1}[0-9]{1,2}
 
// # GRAMMAR IMPLEMENTATION
// Who calls this function?
function start(atoms: Atom[]) {
  for(let i = 0; i < atoms.length; i++) { 
    const atom = atoms[i]
    parseExpression(atom)
  }
}

function parseExpression(atom: Atom): Res_Parsing {
  const node = {} as Node
  const err = {} as Err_Parsing

  parseTerm(atom)

  // or number?
  return {node, err}
}

function parseTerm(atom: Atom): Res_Parsing {
  const node = {} as Node
  const err = {} as Err_Parsing

  parseTerm(atom)

  // or number?
  return {node, err}
}
const ops = ['+', '-', '*', '/'] as const 
const ALLOWED_SYMBOLS = {
  ops: ops,
  nums: ['1', '2', '.', ','],
  brackets: ['(', ')'],
  // and cell references...
}

type Atom = {
  position: {
    start: number,
    end: number
  },
  content: string, 
  type: 'value' | 'op' | 'brack' | undefined
}
type Node = {
  value: number,
  left: number,
  right: number,
  op: typeof ops 
}

// RESULT TYPES
// Probably simplify this
type Res_FirstPass = {
  errors: Err_InvalidChar[],
  atoms: Atom[]
}
type Res_SecondPass = {
  errors: Err_InvalidSyntax[],
  nodes: Node[]
}
type Res_Parsing = {
  err: Err_Parsing,
  node: Node
}



// UTILS
//function isNumber(str: string) {
//  return !isNaN(Number(str))
//}
function isValidValue(char: string): boolean {
  return /[a-zA-Z0-9\.\,]/.test(char)
}
function createEmptyAtom(start: number): Atom {
  return {
    position: {
      start: start,
      end: -1 // Will be filled in later
    },
    content: "",
    type: undefined
  };
}

// PARSING FUNCTIONS
//
// 1. makeAtoms()
// Goes char by char,
// outputs a list of objects ("atoms") that
// is easier to work with.
//
// Example
// In: "11*(2+3)"
// Out(approximation): {atoms: [{value: 11, position: {...}, ...}, ...], errors: []}
export function makeAtoms(rawInput: string): Res_FirstPass {
  const atoms = [] as Atom[]
  const errors = [] as Err_InvalidChar[]

  // ALGO 1
  // go char by char
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
      atom.content = rawInput.substring(atom.position.start, atom.position.end)

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
      atom.content = rawInput[ind]

      atoms.push(atom)

      continue
    }

    // if it's an op, add char to atoms
    if(ALLOWED_SYMBOLS.ops.includes(rawInput[ind])) {
      const atom = createEmptyAtom(ind)

      atom.position.end = ind + 1
      atom.type = 'op'
      atom.content = rawInput[ind]

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

export function makeNodes(atoms: Atom[]): Res_SecondPass {
  const nodes = [] as Node[]
  const errors = [] as Err_InvalidSyntax[]

  for (let ind = 0; ind < atoms.length; ind++) {
    const atom = atoms[ind];

    if( atom.type === 'value' ) {
      // makeNode()?

    }
  }

  return {
    nodes,
    errors
  }
}

