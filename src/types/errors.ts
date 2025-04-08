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
export type Err_InvalidChar = {
  char: string,
  charIndex: number,
  msg: string
}
export type Err_InvalidSyntax = {
  node: string,
  nodeIndex: number,
  msg: string
}
export type Err_Parsing = {
  nodeRaw: string,
  nodeIndex: number,
  msg: string
}
