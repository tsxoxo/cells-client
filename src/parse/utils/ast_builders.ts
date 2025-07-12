import { Node_Cell, Node_Func } from "../types/ast"
import { Token } from "../types/token"
import { FunctionKeyword } from "./func"

export const buildNode = {
    func: buildNode_func,
    cell: buildNode_cell,
}

function buildNode_func({
    value,
    start,
    cells,
}: {
    value: FunctionKeyword
    start: number
    cells: Node_Cell[]
}): Node_Func {
    return {
        type: "func_range",
        value,
        start,
        cells,
    }
}

function buildNode_cell(token: Token): Node_Cell {
    return {
        type: "cell",
        value: token.value,
        start: token.start,
    }
}
