import { ALPHABET_WITH_FILLER } from "../constants"
import { Cell } from "../types"
import {
  getNumbersFromCells,
  getCellsInRange,
  getIndexFromCellName,
} from "./cellUtils"
import { applyFuncToValues } from "./func"
import {
  Failure,
  InterpretError,
  InterpretErrorType,
  Result,
  fail,
  isSuccess,
  success,
} from "./types/errors"
import { Tree } from "./types/grammar"

export function interpret(
  tree: Tree,
  cells: Cell[],
  _numberOfCols?: number,
): Result<{ res: number; deps: number[] }, InterpretError> {
  const numberOfCols = _numberOfCols ?? ALPHABET_WITH_FILLER.length - 1
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
        return createError({
          type: "CELL_UNDEFINED",
          node,
          expected: "cell to contain numerical value",
        })
      }

      if (typeof cell.value !== "number") {
        return createError({
          type: "CELL_NOT_A_NUMBER",
          node,
          expected: "cell to contain a number",
        })
      }

      // Happy path: cell contains a number
      deps.push(cellIndex)

      return success(cell.value)
    }

    if (node.type === "binary_op") {
      const leftResult = solveNode(node.left)
      const rightResult = solveNode(node.right)

      // If either operand is already an error, just return it
      if (!isSuccess(leftResult)) return leftResult
      if (!isSuccess(rightResult)) return rightResult

      calcResult = calculate(node, leftResult.value, rightResult.value)

      if (!isSuccess(calcResult)) {
        return createError({
          type: calcResult.error.type,
          node,
          expected: "valid calculation result",
        })
      }

      return calcResult
    }

    if (node.type === "func") {
      const from = getIndexFromCellName(node.from.value)
      const to = getIndexFromCellName(node.to.value)
      // Arg order of from and to does not matter, cells get sorted in getCellsinRange.
      const cellsInRange = getCellsInRange(
        from,
        to,
        // Subtract the filler
        numberOfCols,
      )
      const resolvedRange = getNumbersFromCells(cellsInRange, cells)

      if (!isSuccess(resolvedRange)) {
        // Some cell contains not a number.
        // Enrich error from getNumbersFromCells
        //
        // TODO: START HERE
        // Think about how to do this:
        // We want this to bubble up to state:
        // * the number of the cell (to display: 'cell A9 contains non-numeric value')
        // * the position of the token (for marking the literal range in the UI: "A9:A19")
        // * probably the literal range itself ("A9:A19") to display in err msg
        // * probably the node, for logging (easy)
        //
        return createError({
          type: resolvedRange.error.type, // "CELL_NOT_A_NUMBER"
          node,
          cell: resolvedRange.error.cell,
          range: `${node.from.value}:${node.to.value}`,
          expected: "all cells in range to contain valid numbers",
        })
      }

      const result = applyFuncToValues(node.value, resolvedRange.value)

      // This should only happen if the tokenizer lets through an invalid func reference
      if (!isSuccess(result)) {
        return createError({
          type: result.error.type,
          node,
          expected: "valid result from applyFuncToValues",
        })
      }

      // Happy path: func processed successfully.
      deps.push(...cellsInRange)

      return result
    }

    // unexpected node type
    // safety net.
    // not sure how we would get here.
    return createError({
      type: "UNKNOWN_ERROR",
      node,
      expected: "valid node type",
    })
  }

  const res = solveNode(tree)

  return res.ok ? success({ res: res.value, deps }) : res
}

// Takes node of type binary_op and its resolved operands.
// (We pass in the whole node for easier error handling.)
// Returns calculated result.
// The error is a simplified object that gets enriched up the chain.
function calculate(
  node: Tree,
  left: number,
  right: number,
): Result<number, { type: "DIVIDE_BY_0" | "UNKNOWN_ERROR" }> {
  const op = node.value

  switch (op) {
    case "+":
      return success(left + right)
    case "-":
      return success(left - right)
    case "*":
      return success(left * right)
    case "/":
      return right === 0 ? fail({ type: "DIVIDE_BY_0" }) : success(left / right)
    default:
      // If we got here, something went seriously wrong during tokenizing.
      return fail({ type: "UNKNOWN_ERROR" })
  }
}

function createError({
  type,
  node,
  cell,
  range,
  expected,
}: {
  type: InterpretErrorType
  // Not sure how much sense it make to expect 'null'
  node: Tree
  cell?: number
  range?: string
  expected: string
}): Failure<InterpretError> {
  return fail({
    type,
    node,
    cell,
    range,
    msg: `${type} in Interpreter: expected [${expected}], got [${node.value}]`,
  })
}
