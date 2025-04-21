import { ALPHABET_WITH_FILLER } from "../constants"
import { Cell } from "../types"
import {
  getCellValues,
  getCellsInRange,
  getIndexFromCellName,
} from "./cellUtils"
import { applyFuncToValues } from "./func"
import {
  InterpretError,
  Result,
  fail,
  isSuccess,
  success,
} from "./types/errors"
import { Tree } from "./types/grammar"

export function interpret(
  tree: Tree,
  cells: Cell[],
): Result<{ formulaResult: number; deps: number[] }, InterpretError> {
  const deps: number[] = []

  function solveNode(node: Tree): Result<number, InterpretError> {
    let calcResult

    // base case
    if (node.type === "number") {
      return success(parseFloat(node.value))
    }

    if (node.type === "cell") {
      const cellIndex = getIndexFromCellName(node.value)
      const cell = cells[cellIndex]

      if (cell === undefined) {
        return fail({
          type: "INVALID_CELL",
          node,
          info: "cell undefined",
        })
      }

      deps.push(cellIndex)

      return typeof cell.value === "number"
        ? success(cell.value)
        : fail({
            type: "INVALID_CELL",
            node,
            info: "Referenced cell not a number",
          })
    }

    if (node.type === "binary_op") {
      const leftResult = solveNode(node.left)
      const rightResult = solveNode(node.right)

      // If either operand is already an error, just return it
      if (!isSuccess(leftResult)) return leftResult
      if (!isSuccess(rightResult)) return rightResult

      calcResult = calculate(node, leftResult.value, rightResult.value)

      return calcResult
    }

    if (node.type === "func") {
      const from = getIndexFromCellName(node.from)
      const to = getIndexFromCellName(node.to)
      // Arg order of from and to does not matter, cells get sorted in getCellsinRange.
      const cellsInRange = getCellsInRange(
        from,
        to,
        // Subtract the filler
        ALPHABET_WITH_FILLER.length - 1,
      )
      const resolvedRange = getCellValues(cellsInRange, cells)

      if (!isSuccess(resolvedRange)) {
        return fail({
          type: "INVALID_CELL",
          node,
          msg: `Error in function '${node.value}': ${resolvedRange.error.msg}`,
        })
      }

      const result = applyFuncToValues(node.value, resolvedRange.value)
      if (!isSuccess(result)) {
        return fail({
          type: "INVALID_CELL",
          node,
          msg: `Error in function '${node.value}': ${result.error.msg}`,
        })
      }

      // Happy path: func processed successfully.
      deps.push(...cellsInRange)

      return result
    }

    // unexpected node type
    return fail({
      type: "UNEXPECTED_NODE",
      node,
    })
  }

  const formulaResult = solveNode(tree)

  return formulaResult.ok
    ? success({ formulaResult: formulaResult.value, deps })
    : formulaResult
}

// Takes node of type binary_op and its resolved operands.
// (We pass in the whole node for easier error handling.)
// Returns calculated result.
function calculate(
  node: Tree,
  left: number,
  right: number,
): Result<number, InterpretError> {
  const op = node.value

  switch (op) {
    case "+":
      return success(left + right)
    case "-":
      return success(left - right)
    case "*":
      return success(left * right)
    case "/":
      return right === 0
        ? fail({ type: "DIVIDE_BY_0", node })
        : success(left / right)
    default:
      return fail({ type: "UNKNOWN_OP", node })
  }
}
