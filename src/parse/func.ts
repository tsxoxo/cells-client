// #####################################################################
// CUSTOM FUNCTIONS
// #####################################################################
// Functions called in formula via special keywords.
// Example: 'sum' in '2+sum(a0:b12)'
import { BaseError, Result, fail, success } from "./types/errors"

export const FUNCTION_KEYWORDS = ["sum"] as const
export type FunctionKeyword = (typeof FUNCTION_KEYWORDS)[number]

export function applyFuncToValues(
  funcName: string,
  values: number[],
): Result<number, BaseError> {
  const normalizedFuncName = funcName.toLowerCase() as FunctionKeyword

  if (!FUNCTIONS[normalizedFuncName]) {
    return fail({
      type: "UNKNOWN_FUNCTION",
      msg: `Unknown function keyword ${funcName}`,
    })
  }
  return FUNCTIONS[normalizedFuncName](values)
}

const FUNCTIONS: Record<
  FunctionKeyword,
  (numbers: number[]) => Result<number, BaseError>
> = {
  sum: (numbers) => {
    return success(numbers.reduce((cur, acc) => acc + cur))
  },
}
