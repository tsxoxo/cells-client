import { FunctionKeyword } from "./func"
import { Node_Cell, Node_Func_Range, Token } from "./types/grammar"

export const buildNode = {
    func_range: buildNode_funcRage,
    cell: buildNode_cell,
}

function buildNode_funcRage({
    value,
    start,
    from,
    to,
}: {
    value: FunctionKeyword
    start: number
    from: Node_Cell
    to: Node_Cell
}): Node_Func_Range {
    return {
        type: "func_range",
        value,
        start,
        from,
        to,
    }
}

function buildNode_cell(token: Token): Node_Cell {
    return {
        type: "cell",
        value: token.value,
        start: token.start,
    }
}
