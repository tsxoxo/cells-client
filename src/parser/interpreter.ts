import { Node_Binary, Token } from "./types/grammar"

export function interpreter( tree: string ): number {
  const result

  function solveNode( node: Node_Binary | Token ) {
    let result

    // NOTE:
    // Start here: base case
    // what is a node, really?
    if (node.)

    switch( node.op ) {
      case '+':
        result = solveNode( node.left ) + solveNode( node.right )
        break
      case '-':
        result = solveNode( node.left ) - solveNode( node.right )
        break
      case '*':
        result = solveNode( node.left ) * solveNode( node.right )
        break
      case '/':
        result = solveNode( node.left ) / solveNode( node.right )
        break
    }
  }
  return result
}
