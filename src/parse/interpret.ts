import { Result, fail, isSuccess, success } from "./types/errors"
import { Tree } from "./types/grammar"

export function interpreter( tree: Tree ): Result<number> {
  //let result = 0

  function solveNode( node: Tree ): Result<number> {
    let result

    // base case
    if (node.type === "number") {
      return success( parseFloat(node.value) )
    }

    if (node.type === "binary_op") {
      const leftResult = solveNode(node.left)
      const rightResult = solveNode(node.right)

      // If either operand is already an error, just return it
      if (!isSuccess(leftResult)) return leftResult
      if (!isSuccess(rightResult)) return rightResult

      switch( node.value ) {
        case '+':
          result = leftResult.value + rightResult.value
          return success( result )
        case '-':
          result = leftResult.value - rightResult.value
          return success( result )
        case '*':
          result = leftResult.value * rightResult.value
          return success( result )
        case '/':
          result = leftResult.value / rightResult.value
          return success( result )
        default: 
          return fail( 'unknown operator!' )
      }
    }

    return fail( 'neither a number nor an op!' )
  }

  return solveNode(tree)
}

