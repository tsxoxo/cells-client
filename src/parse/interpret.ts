import { ALPHABET_WITH_FILLER, NUM_OF_ROWS } from "../constants";
import { Cell } from "../types";
import { ParseError, Result, fail, isSuccess, success } from "./types/errors";
import { Tree } from "./types/grammar";

export function interpret(
  tree: Tree,
  cells: Cell[],
): Result<{ formulaResult: number; deps: number[] }, ParseError> {
  let deps: number[] = [];

  function solveNode(node: Tree): Result<number, ParseError> {
    let calcResult;

    // base case
    if (node.type === "number") {
      return success(parseFloat(node.value));
    }

    if (node.type === "cell") {
      const cellIndex = getIndexFromCellName(node.value);
      const cell = cells[cellIndex];

      if (cell === undefined) {
        return fail({ type: "INVALID_CELL" });
      }

      deps.push(cellIndex);

      return typeof cell.value === "number"
        ? success(cell.value)
        : fail({ type: "INVALID_CELL" });
    }

    if (node.type === "binary_op") {
      const leftResult = solveNode(node.left);
      const rightResult = solveNode(node.right);

      // If either operand is already an error, just return it
      if (!isSuccess(leftResult)) return leftResult;
      if (!isSuccess(rightResult)) return rightResult;

      calcResult = calculate(node.value, leftResult.value, rightResult.value);

      return calcResult;
    }

    // unexpected node type
    return fail({ type: "UNEXPECTED_NODE" });
  }

  const formulaResult = solveNode(tree);

  return formulaResult.ok
    ? success({ formulaResult: formulaResult.value, deps })
    : formulaResult;
}

function calculate(
  op: string,
  left: number,
  right: number,
): Result<number, ParseError> {
  switch (op) {
    case "+":
      return success(left + right);
    case "-":
      return success(left - right);
    case "*":
      return success(left * right);
    case "/":
      return right === 0
        ? fail({ type: "DIVIDE_BY_0" })
        : success(left / right);
    default:
      return fail({ type: "UNKNOWN_OP" });
  }
}

function getIndexFromCellName(cellName: string): number {
  // cellName examples: 'A1', 'B99'
  // We call the letter x and the number y such as 'A0' === (1, 1)
  const x = ALPHABET_WITH_FILLER.indexOf(cellName[0].toUpperCase());
  const y = Number(cellName.slice(1)) + 1;

  return NUM_OF_ROWS * (x - 1) + y - 1;
}
