import { Parser } from "./ast.ts"
import { tokenize } from "./tokenize.ts"
import { ParseError, Result, pipe, bind } from "./types/errors.ts"
import { Tree } from "./types/grammar.ts"

export function parseToAST(formula: string): Result<Tree, ParseError> {
  return pipe(
    tokenize(formula),
    bind((tokens) => new Parser(tokens).makeAST()),
  )
}
