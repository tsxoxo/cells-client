import { describe, expect, it } from "vitest"
import {
    and,
    any,
    between,
    sepBy,
    t,
    zeroOrMore,
} from "../utils/parse_combinators"
import { tokenize } from "../tokenize"
import { assertIsSuccess } from "../types/result"
import { func_shell, PATTERNS } from "../types/grammar"
import { parseTable } from "../ast"

describe("t", () => {
    it("matches correct token and returns rest", () => {
        const parser = t("number")
        const tokens = tokenize("42+12")
        assertIsSuccess(tokens)

        expect(parser(tokens.value)).toEqual({
            ok: true,
            value: {
                match: [tokens.value[0]],
                rest: tokens.value.slice(1),
            },
        })
    })

    it("fails on incorrect token", () => {
        const parser = t("cell")
        const tokens = tokenize("42+12")
        assertIsSuccess(tokens)

        expect(parser(tokens.value)).toEqual({
            ok: false,
            error: {
                type: "UNEXPECTED_TOKEN",
                index: 0,
                expectedType: "cell",
                receivedToken: tokens.value[0],
            },
        })
    })
})

describe("and", () => {
    it("matches correct sequence and returns rest", () => {
        const parser = and(t("number"), t("op"), t("number"))
        const tokens = tokenize("42+12")
        assertIsSuccess(tokens)

        expect(parser(tokens.value)).toEqual({
            ok: true,
            value: {
                match: tokens.value,
                rest: [],
            },
        })
    })

    it("fails on incorrect sequence", () => {
        const parser = and(
            t("number"),
            t("op"),
            t("number"),
            t("op"),
            t("cell"),
        )
        const tokens = tokenize("42+12")
        assertIsSuccess(tokens)

        expect(parser(tokens.value)).toEqual({
            ok: false,
            error: {
                type: "UNEXPECTED_TOKEN",
                index: 0,
                expectedType: "op",
                receivedToken: {
                    start: -1,
                    type: "eof",
                    value: "",
                },
            },
        })
    })
})

describe("zeroOrMore", () => {
    it("matches correct sequence and returns rest", () => {
        const parser = zeroOrMore(sepBy(t("number"), t("op")))
        const tokens = tokenize("42+12*39-60-sum(A1:a2)")
        assertIsSuccess(tokens)

        expect(parser(tokens.value)).toEqual({
            ok: true,
            value: {
                match: tokens.value.slice(0, -7),
                rest: tokens.value.slice(-7),
            },
        })
    })

    it("returns success state with empty array when it doesn't match", () => {
        const parser = zeroOrMore(sepBy(t("number"), t("op")))
        const tokens = tokenize("a1-42+12")
        assertIsSuccess(tokens)

        expect(parser(tokens.value)).toEqual({
            ok: true,
            value: {
                match: [],
                rest: tokens.value,
            },
        })
    })
})

describe("between", () => {
    it("matches correct sequence and returns rest", () => {
        const parser = PATTERNS.FUNC_RANGE
        const tokens = tokenize("sum(A1:a2)+32")
        assertIsSuccess(tokens)

        expect(parser(tokens.value)).toEqual({
            ok: true,
            value: {
                match: tokens.value.slice(2, 5),
                rest: tokens.value.slice(-2),
            },
        })
    })

    it("fails on incorrect core", () => {
        const parser = PATTERNS.FUNC_LIST
        const tokens = tokenize("sum(A1,a2,z99,)+32")
        assertIsSuccess(tokens)

        expect(parser(tokens.value)).toEqual({
            ok: false,
            error: {
                type: "UNEXPECTED_TOKEN",
                index: 0,
                expectedType: "parens_close",
                receivedToken: tokens.value[7],
            },
        })
    })

    it("fails on incorrect shell", () => {
        const parser = between(
            func_shell,
            and(t("cell"), t("op_range"), t("cell")),
        )
        const tokens = tokenize("sum)A1:a2)+32")
        assertIsSuccess(tokens)

        expect(parser(tokens.value)).toEqual({
            ok: false,
            error: {
                type: "UNEXPECTED_TOKEN",
                index: 0,
                expectedType: "parens_open",
                receivedToken: tokens.value[1],
            },
        })
    })

    it("edge case: Func_List succeeds with single cell arg", () => {
        const parser = PATTERNS.FUNC_LIST
        const tokens = tokenize("sum(A1)+32")
        assertIsSuccess(tokens)

        expect(parser(tokens.value)).toEqual({
            ok: true,
            value: {
                match: [tokens.value[2]],
                rest: tokens.value.slice(4),
            },
        })
    })
})

describe("sepBy", () => {
    it("matches correct sequence and returns rest", () => {
        const parser = sepBy(t("number"), t("op"))
        const tokens = tokenize("32*2-49/sum(a1:z00)")
        assertIsSuccess(tokens)

        expect(parser(tokens.value)).toEqual({
            ok: true,
            value: {
                match: tokens.value.slice(0, 5),
                rest: tokens.value.slice(5),
            },
        })
    })

    it("matches single item and returns rest", () => {
        const parser = sepBy(t("number"), t("op"))
        const tokens = tokenize("32")
        assertIsSuccess(tokens)

        expect(parser(tokens.value)).toEqual({
            ok: true,
            value: {
                match: [tokens.value[0]],
                rest: [],
            },
        })
    })

    it("fails on incorrect sequence", () => {
        const parser = sepBy(t("number"), t("op"))
        const tokens = tokenize("a1-32")
        assertIsSuccess(tokens)

        expect(parser(tokens.value)).toEqual({
            ok: false,
            error: {
                type: "UNEXPECTED_TOKEN",
                index: 0,
                expectedType: "number",
                receivedToken: tokens.value[0],
            },
        })
    })
})

describe("any", () => {
    it("matches first correct sequence and returns rest", () => {
        const parser = any(...parseTable.func)
        const tokens = tokenize("sum(A1:a2)+32")
        assertIsSuccess(tokens)

        expect(parser(tokens.value)).toEqual({
            ok: true,
            value: {
                match: tokens.value.slice(2, 5),
                rest: tokens.value.slice(-2),
                handler: parseTable.func[0],
            },
        })
    })

    it("returns all errors", () => {
        const parser = any(...parseTable.func)
        const tokens = tokenize("32")
        assertIsSuccess(tokens)

        expect(parser(tokens.value)).toEqual({
            ok: false,
            error: [
                {
                    type: "UNEXPECTED_TOKEN",
                    index: 0,
                    expectedType: "func",
                    receivedToken: tokens.value[0],
                },
                {
                    type: "UNEXPECTED_TOKEN",
                    index: 0,
                    expectedType: "func",
                    receivedToken: tokens.value[0],
                },
            ],
        })
    })
})
