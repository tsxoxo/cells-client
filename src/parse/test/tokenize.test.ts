import { describe, expect, it } from "vitest"
import { tokenize } from "../tokenize"
import { assertIsFail, assertIsSuccess } from "../types/errors"

// =================================================
// TEST CASES
// =================================================
//
// # Valid formulae
// tokens.length === 11
const validAllOps = "11+2.6*(A1-B11)/7,3"
// Functions
const validFunc = "SUM(A2:Z99)"

// ## Edgecases
// * starts with negative number
const startWithNegative = "-11+2"
// * whitespace
const validWithWhitespace = "     11 +2*(A1-    B11)        / 7    "
//* single values
const singleValidValueSimple = "666"
const singleValidValueCell = "A99"
//
// INVALID
// # [TOKEN] Invalid or ill-formed tokens
//      --> tokenizer
// * Invalid char: "#%`[$=" etc.
const invalidChars = "11^+2*(_3-}4)"
// * [TOKEN] Invalid token:
//      * ill-formed: "a999", "string"
const missingOpen = "SUMA1:A2)*3"

const illFormedTokens = "A11+A001"

describe("tokenizer", () => {
  it("handles valid all ops with cells", () => {
    const result = tokenize(validAllOps)

    assertIsSuccess(result)
    expect(result.value.length).toBe(11)
    expect(result.value[0].value).toBe("11")
    expect(result.value[result.value.length - 1].value).toBe("7,3")
  })

  it("handles funcs", () => {
    const result = tokenize(validFunc)

    assertIsSuccess(result)

    expect(result.value.length).toBe(6)
    expect(result.value[0].value).toBe("SUM")
  })

  // Edgecases
  it("handles single values", () => {
    let result = tokenize(singleValidValueSimple)

    assertIsSuccess(result)
    expect(result.value.length).toBe(1)
    expect(result.value[0].value).toBe("666")

    result = tokenize(singleValidValueCell)

    assertIsSuccess(result)
    expect(result.value.length).toBe(1)
    expect(result.value[0].value).toBe("A99")
  })

  it("handles whitespace", () => {
    const result = tokenize(validWithWhitespace)

    assertIsSuccess(result)
    expect(result.value.length).toBe(11)
    expect(result.value[0].value).toBe("11")
    expect(result.value[result.value.length - 1].value).toBe("7")
  })

  it("handles negative", () => {
    const result = tokenize(startWithNegative)

    assertIsSuccess(result)
    expect(result.value.length).toBe(4)
    expect(result.value[0].value).toBe("-")
    expect(result.value[result.value.length - 1].value).toBe("2")
  })

  // INVALID
  it("handles invalid tokens", () => {
    let result = tokenize(invalidChars)

    assertIsFail(result)
    expect(result.error.type).toBe("TOKEN")

    result = tokenize(illFormedTokens)

    assertIsFail(result)
    expect(result.error.type).toBe("TOKEN")

    result = tokenize(missingOpen)

    assertIsFail(result)
    expect(result.error.type).toBe("TOKEN")
    expect(result.error.token!.value).toBe("SUMA1")
  })
})
