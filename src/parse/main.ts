import { Parser } from "./ast.ts"
import { tokenize } from "./tokenize.ts"
import { ParseError, Result, pipe, bind } from "./types/errors.ts"
import { Token, Tree } from "./types/grammar.ts"

export function parseToAST(formula: string): Result<Tree, ParseError> {
  // I cut out 'interpret' from this pipeline
  // (it gets called directly from state management).
  // I did that because it depends on Cells[].
  // I did not want to pollute this func here with Cells[],
  // so I don't have to mock Cells[] if I want to test this.
  // In hindsight, I'm not sure it's necessary to test this very simple pipe.
  return pipe<Token[], ParseError, Tree>(
    tokenize(formula) as Result<Token[], ParseError>,
    bind((tokens) => new Parser(tokens as Token[]).makeAST()),
  )
}
