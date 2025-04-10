import { Tree } from "./types/grammar"

export function interpreter( tree: Tree ): EvalResult {
  //let result = 0

  function solveNode( node: Tree ): EvalResult {
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
          return failure( 'unknown operator!' )
      }
    }

    return failure( 'neither a number nor an op!' )
  }

  return solveNode(tree)
}

// ERROR HANDLING
 // Define result types
type EvalSuccess = { ok: true; value: number }
type EvalError = { ok: false; error: string; location?: any }
type EvalResult = EvalSuccess | EvalError

// Helper functions
function success(value: number): EvalSuccess {
  return { ok: true, value }
}

function failure(error: string): EvalError {
  return { ok: false, error }
}

// Type guard
function isSuccess(result: EvalResult): result is EvalSuccess {
  return result.ok === true
}
