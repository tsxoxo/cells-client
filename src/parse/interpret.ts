import { ALPHABET_WITH_FILLER } from "../constants"
import { Cell } from "../types"
import {
  getNumbersFromCells,
  getCellsInRange,
  getIndexFromCellName,
} from "./cellUtils"
import { applyFuncToValues } from "./func"
import {
  ErrorType,
  Failure,
  InterpretError,
  Result,
  fail,
  isSuccess,
  success,
} from "./types/errors"
import { Token, Tree } from "./types/grammar"

export function interpret(
  tree: Tree,
  cells: Cell[],
): Result<{ res: number; deps: number[] }, InterpretError> {
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
      const resolvedRange = getNumbersFromCells(cellsInRange, cells)

      if (!isSuccess(resolvedRange)) {
        // Some cell contains not a number.
        // Error from getNumbersFromCells: {cell: number}
        //
        // TODO: START HERE
        // Think about how to do this:
        // We want this to bubble up to state:
        // * the number of the cell (to display: 'cell A9 contains non-numeric value')
        // * the position of the token (for marking the literal range in the UI: "A9:A19")
        // * probably the literal range itself ("A9:A19") to display in err msg
        // * probably the node, for logging (easy)
        //
        return fail({
          node,
        })
      }

      const result = applyFuncToValues(node.value, resolvedRange.value)
      // TODO: This does not seem right error bubbling!
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
    // not sure how we would get here.
    return fail({
      type: "UNKNOWN_ERROR",
      node,
    })
  }

  const res = solveNode(tree)

  return res.ok ? success({ res: res.value, deps }) : res
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
      // If we got here, something went seriously wrong during tokenizing.
      return fail({ type: "UNKNOWN_ERROR", node })
  }
}

function createError({
  type,
  node,
  expected,
}: {
  type: ErrorType
  // Not sure how much sense it make to expect 'null'
  node: Tree
  expected: string
}): Failure<InterpretError> {
  // const tokenDisplayString = token === null ? "null" : token.value
  return fail({
    type,
    node,
    // msg: `${type} in Interpreter: expected [${expected}], got [${tokenDisplayString}]`,
    msg: `${type} in Interpreter: expected [${expected}], got [${node.value}]`,
  })
}
