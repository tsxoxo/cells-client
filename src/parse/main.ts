import { Parser } from './ast.ts'
import { interpret } from './interpret.ts'
import { tokenize } from './tokenize.ts'
import { ParseError, Result, flatMap, pipe, bind } from './types/errors.ts'

export function parseFormula(formula: string): Result<{formulaResult: number, deps: number[]}, ParseError> {
return pipe(
    tokenize( formula ),
    bind(tokens => new Parser(tokens).makeAST()),
    bind(ast => interpret(ast) )
  )
  //return pipe(
  //  tokenize( formula ),
  //  tokens => flatMap(tokens, tokens => new Parser(tokens).makeAST()),
  //  ast => flatMap(ast, ast => interpret(ast) )
  //)
}
