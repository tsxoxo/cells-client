import { Parser } from "./ast.ts"
import { tokenize } from "./tokenize.ts"
import { Node } from "./types/ast.ts"
import { ParseError } from "./types/errors.ts"
import { Result } from "./types/result.ts"

// I cut out 'interpret' from this pipeline
// (it gets called directly from state management).
// I did that because it depends on Cells[].
// I did not want to pollute this func here with Cells[],
// so I don't have to mock Cells[] if I want to test this.
// In hindsight, I'm not sure it's necessary to test this very simple pipe.
export function parseToAST(formula: string): Result<Node, ParseError> {
    const tokenResult = tokenize(formula)
    if (!tokenResult.ok) {
        return tokenResult // TokenizeError passes through
    }

    const astResult = new Parser(tokenResult.value).makeAST()
    if (!astResult.ok) {
        return astResult // ASTError passes through
    }

    return astResult
}
