import { Parser } from "./ast.ts"
import { tokenize } from "./tokenize.ts"
import { ParseError, Result, pipe, bind } from "./types/errors.ts"
import { Token, Tree } from "./types/grammar.ts"

export function parseToAST(formula: string): Result<Tree, ParseError> {
  return pipe<Token[], ParseError, Tree>(
    tokenize(formula) as Result<Token[], ParseError>,
    bind((tokens) => new Parser(tokens as Token[]).makeAST()),
  )
}
