// #####################################################################
// CUSTOM FUNCTIONS
// #####################################################################
// Functions called in formula via special keywords.
// Example: 'sum' in '2+sum(a0:b12)'
import { Result, success } from "./types/errors"

// Define function keywords and their operations.
const FUNCTIONS = {
  sum: (numbers: number[]) => {
    return success(numbers.reduce((cur, acc) => acc + cur))
  },
} satisfies Record<
  string,
  (numbers: number[]) => Result<number, { type: "OVERFLOW" }>
>
// Derive type and helper for match.ts
export type FunctionKeyword = keyof typeof FUNCTIONS
export const FUNCTION_KEYWORDS = Object.keys(FUNCTIONS) as FunctionKeyword[]

// Main API
export function applyFuncToValues(
  funcName: FunctionKeyword,
  values: number[],
): Result<number, { type: "OVERFLOW" }> {
  return FUNCTIONS[funcName](values)
}
