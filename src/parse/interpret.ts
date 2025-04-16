import { ALPHABET_WITH_FILLER, NUM_OF_ROWS } from "../constants"
import { Result, fail, isSuccess, success } from "./types/errors"
import { Tree } from "./types/grammar"

export function interpret( tree: Tree ): Result<{ formulaResult: number, deps: number[] }> {
  let deps: number[] = []

  function solveNode( node: Tree ): Result<number> {
    let calcResult

    // base case
    if (node.type === "number") {
      return success( parseFloat(node.value) )
    }

    if (node.type === "cell" ) {
      deps.push(getIndexFromCellName(node.value))
      return success(0)
    }

    if (node.type === "binary_op") {
      const leftResult = solveNode(node.left)
      const rightResult = solveNode(node.right)

      // If either operand is already an error, just return it
      if (!isSuccess(leftResult)) return leftResult
      if (!isSuccess(rightResult)) return rightResult

      calcResult = calculate( node.value, leftResult.value, rightResult.value )

      return calcResult
    }

    // unexpected node type
    return fail( "TOKEN" )
  }

  const formulaResult = solveNode(tree)

  return formulaResult.ok ? success({ formulaResult: formulaResult.value, deps  }) : formulaResult
}

function calculate( op: string, left: number, right: number ): Result<number> {
  switch( op ) {
    case '+':
      return success( left + right )
    case '-':
      return success( left - right )
    case '*':
      return success( left * right )
    case '/':
      return success( left / right )
    default: 
      return fail( "UNKNOWN_OP" )
  }
}

function getIndexFromCellName(cellName: string): number {
    // cellName examples: 'A1', 'B99'
    // We call the letter x and the number y such as 'A0' === (1, 1)
    const x = ALPHABET_WITH_FILLER.indexOf(cellName[0].toUpperCase())
    const y = Number(cellName.slice(1)) + 1

    return NUM_OF_ROWS * (x - 1) + y - 1
}

