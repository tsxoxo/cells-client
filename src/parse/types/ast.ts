// ============================================================
// --- AST ----------------------------------------------------
// ============================================================

import { FunctionKeyword } from "../utils/func"

export type Node =
    | Node_Binary
    | Node_Number
    | Node_Cell
    | Node_Func
    | Node_Func_Range

interface Node_Base {
    type: string
    value: string
    start: number // Position of corresponding token within the formula string. Currently used only in failure cases.
}

// For binary operations: ['+', '-', '*', '/'],
export interface Node_Binary extends Node_Base {
    type: "binary_op"
    left: Node
    right: Node
}

export interface Node_Number extends Node_Base {
    type: "number"
}

export interface Node_Cell extends Node_Base {
    type: "cell"
}

export interface Node_Func_Range extends Node_Base {
    type: "func_range"
    value: FunctionKeyword
    from: Node_Cell
    to: Node_Cell
}

export interface Node_Func extends Node_Base {
    type: "func"
    value: FunctionKeyword
    from: Node_Cell
    to: Node_Cell
}

// Used for testing
export function assertBinaryOp(node: Node): asserts node is Node_Binary {
    if (node.type !== "binary_op") {
        throw new Error(
            `node is not of type "binary_op! node: ${JSON.stringify(node, null, 2)}`,
        )
    }
}
