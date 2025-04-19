import { ALPHABET_WITH_FILLER, NUM_OF_ROWS } from "../constants"
import { Cell } from "../types"
import { getCellsInRange } from "./cellUtils"
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
      const to = getIndexFromCellName(node.to)
      const from = getIndexFromCellName(node.from)
      const sorted = [to, from].sort()
      const cellsInRange = getCellsInRange(
        sorted,
        ALPHABET_WITH_FILLER.length - 1,
      )
      const result = applyFuncToRange(node.value, cellsInRange)

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

function applyFuncToRange(
  func: string,
  range: number[],
): Result<number, InterpretError> {}

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

function getIndexFromCellName(cellName: string): number {
  // cellName examples: 'A1', 'B99'
  // We call the letter x and the number y such as 'A0' === (1, 1)
  const x = ALPHABET_WITH_FILLER.indexOf(cellName[0].toUpperCase())
  const y = Number(cellName.slice(1)) + 1

  return NUM_OF_ROWS * (x - 1) + y - 1
}
