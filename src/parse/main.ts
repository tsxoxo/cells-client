import { Parser } from './ast.ts'
import { interpret } from './interpret.ts'
import { tokenize } from './tokenize.ts'
import { Result, flatMap, pipe } from './types/errors.ts'

export function parseFormula(formula: string): Result<{formulaResult: number, deps: number[]}> {
  return pipe(
    tokenize( formula ),
    tokens => flatMap(tokens, tokens => new Parser(tokens).makeAST()),
    ast => flatMap(ast, ast => interpret(ast) )
  )
}
