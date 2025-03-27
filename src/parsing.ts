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
type ParsingError = {
  type: string,
  tokenIndex: number
}
type Atom = {
  position: {
    start: number,
    end: number
  },
  content: string, 
  type: 'value' | 'op' | 'brack' | undefined
}
type ValidationResult = {
  errors: ParsingError[],
  atoms: Atom[]
}

const ALLOWED_SYMBOLS = {
  ops: ['+', '-', '*', '/'],
  nums: ['1', '2', '.', ','],
  brackets: ['(', ')'],
  // and cell references...
}

// UTILS
//function isNumber(str: string) {
//  return !isNaN(Number(str))
//}
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

// PARSING
export function atomize(rawInput: string): ValidationResult {
  const atoms = [] as Atom[]
  const errors = [] as ParsingError[]

  // ALGO 1
  // go char by char
  for(let ind = 0; ind < rawInput.length; ind++) {
    const atom = createEmptyAtom(ind)
    const char = rawInput[ind]

    // if it's anything else (ideally, numbers, points for floats and cell references)
    // keep going until an op and add that whole chunk as an atom
    if(/[\d\w\.\,]/.test(char)) {
        while(/[\d\w\.\,]/.test(rawInput[ind])) {
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

      ind--

      continue
    }

    // if it's a bracket, add char to atoms
    if(ALLOWED_SYMBOLS.brackets.includes(char)) {
      atom.position.end = ind + 1
      atom.type = 'brack'
      atom.content = char
      
      atoms.push(atom)

      continue
    }
    // if it's an op, add char to atoms
    if(ALLOWED_SYMBOLS.ops.includes(char)) {
      atom.position.end = ind + 1
      atom.type = 'op'
      atom.content = char

      atoms.push(atom)

      continue
    }
    // Must be an invalid character.
    errors.push({
      type: `Invalid character ${char} at ${ind}`,
      tokenIndex: ind
    })
  }

  return {
    atoms,
    errors
  }
}

