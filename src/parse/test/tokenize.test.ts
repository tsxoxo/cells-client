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
// * [INVALID_CHAR]: "#%`[$=" etc.
// NOTE: Invalid chars also get caught under different error types: e.g. INVALID_NUMBER
// Put invalid char in front to test this specifically
const err_invalidChar = "$+2*(3-4)"
// * [INVALID_NUMBER]
const err_INVALID_NUMBER = "a99+02+37b"
//      * ill-formed: "a999", "string"
const missingOpen = "SUMA1:B2)*3"

const err_INVALID_CELL = "A11+B001"

describe("tokenizer", () => {
  it("handles valid all ops with cells", () => {
    const result = tokenize(validAllOps)

    assertIsSuccess(result)
    expect(result.value.length).toBe(11)
    expect(result.value[0].value).toBe("11")
    expect(result.value[result.value.length - 1].value).toBe("7,3")
  })

  it("handles functions", () => {
    const result = tokenize(validFunc)

    assertIsSuccess(result)

    expect(result.value.length).toBe(6)
    expect(result.value[0].value).toBe("SUM")
    expect(result.value[0].position.start).toBe(0)
    expect(result.value[0].position.end).toBe(3)
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
    let result = tokenize(err_invalidChar)
    assertIsFail(result)
    expect(result.error.type).toBe("INVALID_CHAR")
    expect(result.error.token!.position.start).toBe(0)
    expect(result.error.token!.position.end).toBe(1)

    result = tokenize(err_INVALID_CELL)
    assertIsFail(result)
    expect(result.error.type).toBe("INVALID_CELL")
    expect(result.error.token!.value).toBe("B001")

    result = tokenize(err_INVALID_NUMBER)
    assertIsFail(result)
    expect(result.error.token!.value).toBe("37b")
    expect(result.error.type).toBe("INVALID_NUMBER")

    result = tokenize(missingOpen)
    assertIsFail(result)
    expect(result.error.type).toBe("UNKNOWN_FUNCTION")
    expect(result.error.token!.value).toBe("SUMA1")
  })
})
