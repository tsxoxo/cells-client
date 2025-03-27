import {describe, expect, it} from 'vitest'
import {atomize} from './parsing'

// # Test cases
// ## Valid
// * Buffet simple: 11+2*(3-4)/7
const validSimple = "11+2*(3-4)/7"
// * Buffet with cell reference: 11+2*(A1-B11)/7
const validWithCells = "11+2*(A1-B11)/7" 
//
// * Floating numbers
//      * using '.' or ','
//      * omitted 0 like 2+.5 = 2.5
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
// * Invalid operation
// * Invalid operand
// * Invalid operand from cell reference
//    * i.e. A1 + A2 -> "cell 'A1' is not a number"
// * Invalid cell reference
//    * i.e. A999 + A2 -> "cell A999 does not exist"
// * Invalid bracket placement
//      * ())), )(, ()
describe('Atomize', () => {
  it('handles valid all ops', () => {
    const result = atomize(validSimple)

    expect(result.atoms.length).toBe(11)
    expect(result.errors.length).toBe(0)

  })
  
  it('handles valid all ops with cells', () => {
    const result = atomize(validWithCells)

    expect(result.atoms.length).toBe(11)
    expect(result.errors.length).toBe(0)

  })

  // Edgecases
  it('handles single valid primitive value', () => {
    const result = atomize(singleValidValueSimple)

    expect(result.atoms.length).toBe(1)
    expect(result.errors.length).toBe(0)

  })
  
  it('handles single valid cell value', () => {
    const result = atomize(singleValidValueCell)

    expect(result.atoms.length).toBe(1)
    expect(result.errors.length).toBe(0)

  })

  //it('handles whitespace', () => {
  //  const result = atomize('=      2   +9   ')
  //
  //  expect(result.errors).toHaveLength(0)
  //})
})
