import { describe, expect, it } from "vitest"
import { t } from "../utils/parse_combinators"
import { tokenize } from "../tokenize"
import { assertIsSuccess } from "../types/result"

describe("t", () => {
    // START_HERE: think about scott wlaschin's 'unit tests are bullshit'
    // (i would tend to at least write some simple regression tests)
    // * then, write the toNode and actually plug in the new patterns/parsers!
    it("matches single token", () => {
        const parseNumber = t("number")
        const tokenNumber = tokenize("42")
        assertIsSuccess(tokenNumber)

        expect(parseNumber(tokenNumber.value)).toEqual({
            ok: true,
            value: {
                match: tokenNumber.value,
                rest: [],
            },
        })
    })
})
