// #####################################################################
// CUSTOM FUNCTIONS
// #####################################################################
// Functions called in formula via special keywords.
// Example: 'sum' in '2+sum(a0:b12)'
import { Result, success } from "./types/errors"

export const FUNCTION_KEYWORDS = ["sum"] as const
export type FunctionKeyword = (typeof FUNCTION_KEYWORDS)[number]

export function applyFuncToValues(
  funcName: string,
  values: number[],
): Result<number, { type: "UNKNOWN_ERROR" }> {
  const normalizedFuncName = funcName.toLowerCase() as FunctionKeyword

  // Safety net.
  // The tokenizer already tests for this.
  if (!FUNCTIONS[normalizedFuncName]) {
    throw new Error(
      `applyFuncToValues: Unexpected error. Trying to use unknown function ${normalizedFuncName}`,
    )
  }
  return FUNCTIONS[normalizedFuncName](values)
}

const FUNCTIONS: Record<
  FunctionKeyword,
  // "UNKNOWN_ERROR" is a stand in for overflow errors (number or result too big)
  // to be added later
  (numbers: number[]) => Result<number, { type: "UNKNOWN_ERROR" }>
> = {
  sum: (numbers) => {
    return success(numbers.reduce((cur, acc) => acc + cur))
  },
}
