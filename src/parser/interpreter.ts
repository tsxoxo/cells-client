import { isNumber } from "./matchers"
import { Tree } from "./types/grammar"

export function interpreter( tree: Tree ): number | string {
  //let result = 0

  function solveNode( node: Tree ): number | string {
    let result

    // NOTE:
    // base case
    if (node.type === "number") {
      return parseFloat(node.value)
    }

    if (node.type === "binary_op") {
      const leftResult = solveNode(node.left)
      const rightResult = solveNode(node.right)

      // If either operand is already an error, just return it
      if (!isNumber(leftResult)) return leftResult
      if (!isNumber(rightResult)) return rightResult

      switch( node.value ) {
        case '+':
          result = solveNode( node.left ) + solveNode( node.right )
          return result
        case '-':
          result = solveNode( node.left ) - solveNode( node.right )
          return result
        case '*':
          result = solveNode( node.left ) * solveNode( node.right )
          return result
        case '/':
          result = solveNode( node.left ) / solveNode( node.right )
          return result
        default: 
          return 'unknown operator!'
      }
    }

    return 'neither a number nor an op!'
  }

  return solveNode(tree)
}
