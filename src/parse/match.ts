import { FUNCTION_KEYWORDS, FunctionKeyword } from "./func"

export const cellPatternAnchored = /^[a-zA-Z]{1}[0-9]{1,2}$/

export function isNumber(str: string): boolean {
  // Include float input using "," and "."
  // TODO: Edgecases like "1.0000000000"
  return /^[0-9]+((,|\.)[0-9]+)?$/.test(str)
}

export function isCellRef(str: string): boolean {
  // Allow both formats: "A1" and "A01"
  return cellPatternAnchored.test(str)
}

export function isOp(str: string): boolean {
  return /^[+\-*/:]$/.test(str)
}

export function isParens(str: string): boolean {
  return /^[()]$/.test(str)
}

export function isWhitespace(str: string): boolean {
  return /^\s$/.test(str)
}

export function isFunc(str: string): str is FunctionKeyword {
  const normalizedStr = str.toLowerCase() as FunctionKeyword
  return FUNCTION_KEYWORDS.includes(normalizedStr as FunctionKeyword)
}

export function isValidValue(char: string): boolean {
  return /[a-zA-Z0-9.,]/.test(char)
}
