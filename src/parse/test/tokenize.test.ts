import { assert, describe, expect, it } from "vitest"
import { tokenize } from "../tokenize"

// =================================================
// TEST CASES
// =================================================
//
// # Valid formulae
// tokens.length === 11
const validAllOps = "11+2.6*(A1-B11)/7,3"

// ## Edgecases
// * starts with negative number
const startWithNegative = "-11+2"
// * whitespace
const validWithWhitespace = "     11 +2*(A1-    B11)        / 7    "
//* single values
const singleValidValueSimple = "666"
const singleValidValueCell = "A99"
//
// # [TOKEN] Invalid or ill-formed tokens
//      --> tokenizer
// * Invalid char: "#%`[$=" etc.
const invalidChars = "11^+2*(_3-}4)"
// * [TOKEN] Invalid token:
//      * ill-formed: "A999", "string"
const illFormedTokens = "A11+A001"

describe("tokenizer", () => {
  it("handles valid all ops with cells", () => {
    const result = tokenize(validAllOps)

    assert(result.ok === true)
    expect(result.value.length).toBe(11)
    expect(result.value[0].value).toBe("11")
    expect(result.value[result.value.length - 1].value).toBe("7,3")
  })

  // Edgecases
  it("handles single values", () => {
    let result = tokenize(singleValidValueSimple)

    assert(result.ok === true)
    expect(result.value.length).toBe(1)
    expect(result.value[0].value).toBe("666")

    result = tokenize(singleValidValueCell)

    assert(result.ok === true)
    expect(result.value.length).toBe(1)
    expect(result.value[0].value).toBe("A99")
  })

  it("handles whitespace", () => {
    const result = tokenize(validWithWhitespace)

    assert(result.ok === true)
    expect(result.value.length).toBe(11)
    expect(result.value[0].value).toBe("11")
    expect(result.value[result.value.length - 1].value).toBe("7")
  })

  it("handles negative", () => {
    const result = tokenize(startWithNegative)

    assert(result.ok === true)
    expect(result.value.length).toBe(4)
    expect(result.value[0].value).toBe("-")
    expect(result.value[result.value.length - 1].value).toBe("2")
  })

  // INVALID
  it("handles invalid tokens", () => {
    let result = tokenize(invalidChars)

    assert(result.ok === false)
    expect(result.error.type).toBe("TOKEN")

    result = tokenize(illFormedTokens)

    assert(result.ok === false)
    expect(result.error.type).toBe("TOKEN")
  })
})
