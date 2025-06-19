import { type CellValueProvider } from "./cellUtils"
import { applyFuncToValues } from "./func"
import {
  Failure,
  InterpretErrorType,
  ParseError,
  Result,
  fail,
  isSuccess,
  success,
} from "./types/errors"
import { Node } from "./types/grammar"

export function interpret(
  tree: Node,
  cellValueProvider?: CellValueProvider,
  currentCellIndex?: number,
): Result<{ res: number; deps: number[] }, ParseError> {
  const deps: number[] = []

  const res = solveNode(tree)
  return res.ok
    ? success({ res: res.value, deps: [...new Set(deps)] }) // de-duplicate deps
    : res

  function solveNode(node: Node): Result<number, ParseError> {
    let calcResult

    switch (node.type) {
      // base case
      case "number":
        return success(parseFloat(node.value))

      case "cell": {
        if (cellValueProvider === undefined) {
          throw new Error(
            "Interpret: missing argument 'cellValueProvider' while evaluating node of type 'cell'",
          )
        }

        const cellValueResult = cellValueProvider.getCellValue(
          node.value,
          currentCellIndex,
        )
        if (!isSuccess(cellValueResult)) {
          switch (cellValueResult.error.type) {
            case "CIRCULAR_CELL_REF":
              return createError({
                type: cellValueResult.error.type,
                node,
                expected: "cell to not contain reference to itself",
              })

            case "CELL_NOT_A_NUMBER":
              return createError({
                type: cellValueResult.error.type,
                node,
                cell: cellValueResult.error.cellIndex,
                expected: "cell to contain a number",
              })

            // Unexpected error type == something went seriously wrong.
            // Unknown state, so we crash.
            default:
              throw new Error(
                `Interpret received unknown error from cellValueProvider.getCellValue: ${cellValueResult.error.type}.`,
              )
          }
        }

        // Happy path: cell contains a number
        deps.push(cellValueResult.value.cellIndex)

        return success(cellValueResult.value.cellValue)
      }

      case "binary_op": {
        const leftResult = solveNode(node.left)
        const rightResult = solveNode(node.right)

        // If either operand is already an error, just return it
        if (!isSuccess(leftResult)) return leftResult
        if (!isSuccess(rightResult)) return rightResult

        calcResult = calculate(node, leftResult.value, rightResult.value)

        if (!isSuccess(calcResult)) {
          return createError({
            type: calcResult.error.type,
            node: node.right,
            expected: "valid calculation result",
          })
        }

        return calcResult
      }

      case "func": {
        if (cellValueProvider === undefined) {
          throw new Error(
            "Interpret: missing argument 'cellValueProvider' while evaluating node of type 'func'",
          )
        }

        const rangeValuesResult = cellValueProvider.getRangeValues(
          node.from.value,
          node.to.value,
          currentCellIndex,
        )
        if (!isSuccess(rangeValuesResult)) {
          return createError({
            type: rangeValuesResult.error.type,
            node,
            expected: "cells in range to contain numeric values",
          })
        }

        // Happy path
        const result = applyFuncToValues(
          node.value,
          rangeValuesResult.value.cellValuesInRange,
        )

        // This should only happen if the tokenizer lets through an invalid func reference.
        // Something went very wrong. Abort mission.
        if (!isSuccess(result)) {
          throw new Error(
            `interpret: got unknown function keyword ${node.value}. This indicates an error in the tokenizer`,
          )
        }

        // Happy path: func processed successfully.
        deps.push(...rangeValuesResult.value.cellIndexesInRange)

        return result
      }

      default:
        // unexpected node type, something went seriously wrong
        throw new Error(
          `Interpreter received unknown node type: ${node.type}. This indicates a bug in Parser.makeAST.`,
        )
    }
  }
}

// Takes node of type binary_op and its resolved operands.
// (We pass in the whole node for easier error handling.)
// Returns calculated result.
// The error is a simplified object that gets enriched up the chain.
function calculate(
  node: Node,
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
  expected,
}: {
  type: InterpretErrorType
  node: Node
  cell?: number
  expected: string
}): Failure<ParseError> {
  return fail({
    type,
    payload: node,
    cell,
    msg: `${type} in Interpreter: expected [${expected}], got [${node.value}]`,
  })
}
