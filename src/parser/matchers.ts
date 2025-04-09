export function isNumber(tokenValue: string): boolean {
  // Include float input using "," and "."
  // TODO: Edgecases like "1.0000000000"
  return /[0-9]+((,|\.)[0-9]+)?/.test(tokenValue)
}

export function isCellRef(tokenValue: string): boolean {
  // Allow both formats: "A1" and "A01"
  return /[a-zA-Z]{1}[0-9]{1,2}/.test(tokenValue)
}

export function isValidValue(char: string): boolean {
  return /[a-zA-Z0-9\.\,]/.test(char)
}

