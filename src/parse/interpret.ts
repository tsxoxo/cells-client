import { type CellValueProvider } from "./cellUtils"
import { applyFuncToValues } from "./func"
import {
    Failure,
    InterpretErrorType,
    ParseError,
    Result,
    assertNever,
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
                // If we didn't get the cell API, something went very wrong.
                if (cellValueProvider === undefined) {
                    throw new Error(
                        "Interpret: 'cellValueProvider' was undefined while evaluating node of type 'cell'",
                    )
                }

                // Try and get the cell's value.
                const cellValueResult = cellValueProvider.getCellValue(
                    node.value,
                    currentCellIndex,
                )

                if (!isSuccess(cellValueResult)) {
                    switch (cellValueResult.error.type) {
                        case "CIRCULAR_CELL_REF":
                            return createError({
                                ...cellValueResult.error,
                                node,
                                expected:
                                    "cell to not contain reference to itself",
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
                            assertNever(
                                "interpret",
                                "error.type from cellValueProvider.getCellValue",
                                cellValueResult.error.type,
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

                calcResult = calculate(
                    node,
                    leftResult.value,
                    rightResult.value,
                )

                if (!isSuccess(calcResult)) {
                    return createError({
                        type: calcResult.error.type,
                        node: node.right,
                        expected: "valid calculation result",
                    })
                }

                return calcResult
            }

            case "func_range": {
                // If we didn't get the cell API, something went very wrong.
                if (cellValueProvider === undefined) {
                    throw new Error(
                        "Interpret: 'cellValueProvider' was undefined while evaluating node of type 'func_range'",
                    )
                }

                // Try to get cell values and indexes in range.
                const rangeValuesResult = cellValueProvider.getRangeValues(
                    node.from.value,
                    node.to.value,
                    currentCellIndex,
                )

                // Enrich error.
                if (!isSuccess(rangeValuesResult)) {
                    switch (rangeValuesResult.error.type) {
                        case "CIRCULAR_CELL_REF":
                            return createError({
                                ...rangeValuesResult.error,
                                node,
                                expected:
                                    "cell to not contain reference to itself",
                            })

                        case "CELL_NOT_A_NUMBER":
                            return createError({
                                ...rangeValuesResult.error,
                                node,
                                expected: "cell to contain a number",
                            })

                        // Unexpected error type == something went seriously wrong.
                        // Unknown state, so we crash.
                        default:
                            assertNever(
                                "interpret",
                                "error.type from cellValueProvider.getRangeValues",
                                rangeValuesResult.error.type,
                            )
                    }
                }
                // Happy path: all values are numeric and no circular ref.
                const result = applyFuncToValues(
                    node.value,
                    rangeValuesResult.value.cellValuesInRange,
                )

                // This should only happen if the tokenizer lets through an invalid func reference.
                // Something went very wrong. Abort mission.
                if (!isSuccess(result)) {
                    assertNever(
                        "interpret",
                        "function keyword",
                        node.value as never,
                    )
                }

                // Happy path: func processed successfully.
                deps.push(...rangeValuesResult.value.cellIndexesInRange)

                return result
            }

            default:
                // unexpected node type, something went seriously wrong
                assertNever("interpret", "node type", node)
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
): Result<number, { type: "DIVIDE_BY_0" }> {
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
                ? fail({ type: "DIVIDE_BY_0" })
                : success(left / right)
        default:
            // If we got here, something went seriously wrong during tokenizing.
            assertNever("interpret.calculate", "operator", op as never)
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
