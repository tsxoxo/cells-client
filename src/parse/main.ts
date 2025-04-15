import { Parser } from './ast.ts'
import { interpret } from './interpret.ts'
import { tokenize } from './tokenize.ts'
import { Result, flatMap, pipe } from './types/errors.ts'

export function parseFormula(formula: string): Result<{calcResult: number, deps: number[]}> {
  return pipe(
    tokenize( formula ),
    tokens => flatMap(tokens, new Parser(tokens).parse()),
    ast => flatMap(ast, ast => interpret )
  )
}
