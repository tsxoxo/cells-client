import { Result, fail, success } from './types/errors.ts'

export function parseFormula(formula: string): Result<{calcResult: number, deps: number[]}> {
  let calcResult = 0
  let deps: number[] = []

  if( formula === 'shit' ) {
    return fail("it's shit", 0)
  }

  return success({
    calcResult,
    deps,
  })
}
