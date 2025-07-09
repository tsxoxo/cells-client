import { tokenize } from "../tokenize"
import {
    Result,
    fail,
    success,
    isSuccess,
    assertIsSuccess,
    Failure,
} from "../types/result"
import { PATTERNS } from "../types/grammar"
import { Token, TokenType } from "../types/token"
import { ASTErrorType } from "../types/errors"

type Parser = (tokens: Token[]) => ParseResult
type ParseError = {
    type: ASTErrorType
    expectedType: TokenType
    receivedToken: Token
    index: number
}
type ParseResult = Result<{ match: Token[]; rest: Token[] }, ParseError>

// Produce something new from a parse result.
// IN: a parser and a mapping function
// OUT: a transformed result and the unparsed rest
export function map<A>(
    parser: (tokens: Token[]) => ParseResult,
    mapFn: (tokens: Token[]) => A,
): (tokens: Token[]) => Result<{ result: A; rest: Token[] }, ParseError> {
    return (tokens) => {
        const parseResult = parser(tokens)

        if (!isSuccess(parseResult)) {
            return parseResult
        }

        const { match, rest } = parseResult.value

        return success({
            result: mapFn(match),
            rest,
        })
    }
}

// Syntactic sugar to simplify code in ast.ts
// TODO: After I'm done with the parser combinators, I want to re-evaluate if we need this
export function makeTransformer<Node>(
    pattern: TokenType[],
    transformFn: (matchedTokens: Token[]) => Node,
): (tokens: Token[]) => Result<{ result: Node; rest: Token[] }, ParseError> {
    return map(matchTokenTypes(pattern), (tokens) => transformFn(tokens))
}

// Parser generator
// IN: a pattern defined in grammar.ts
// OUT: a parser which will match tokens against the IN pattern
export function matchTokenTypes(expected: TokenType[]): Parser {
    return (tokens) => {
        // TODO: rewatch Scott Wlaschin's talk functional design patterns to learn how to deal with this
        if (expected.length === 0) {
            throw new Error(
                `matchTokenTypes got called with an empty array as 'expected' argument`,
            )
        }

        // Compare tokens with expected one by one, the old-fashioned way.
        // Fail fast.
        for (let i = 0; i < expected.length; i++) {
            // Error: We ran out of tokens.
            if (i >= tokens.length) {
                return fail({
                    type: "UNEXPECTED_TOKEN",
                    expectedType: expected[i]!,
                    receivedToken: {
                        type: "eof",
                        value: "",
                        start: -1,
                    },
                    index: i,
                })
            }

            // Error: Token does not match expected.
            if (tokens[i].type !== expected[i]) {
                return fail({
                    type: "UNEXPECTED_TOKEN",
                    expectedType: expected[i]!,
                    receivedToken: tokens[i],
                    index: i,
                })
            }
        }

        // Happy path == Loop ran without errors.
        return success({
            match: tokens.slice(0, expected.length),
            rest: tokens.slice(expected.length),
        })
    }
}

// in-source test suites
if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest

    it("func_matchTypes", () => {
        const func_pattern = matchTokenTypes(
            PATTERNS.FunctionRange.pattern.map(({ type }) => type),
        )
        const func_tokens_result = tokenize("sum(a1:a0)+35")
        assertIsSuccess(func_tokens_result)
        const func_tokens = func_tokens_result.value

        const func_result = func_pattern(func_tokens)

        assertIsSuccess(func_result)
        const func_expected_result = {
            match: func_tokens.slice(0, -2),
            rest: func_tokens.slice(-2),
        }
        expect(func_result.value).toEqual(func_expected_result)
    })

    // TODO:
    // * write test for map
}

function createError({
    expectedType,
    receivedToken,
    index,
}: {
    expectedType: TokenType
    receivedToken: Token
    index: number
}): Failure<ParseError> {
    return fail({
        type: "UNEXPECTED_TOKEN",
        expectedType,
        receivedToken,
        index,
    })
}

// ---
// FUNCTION EXPRESSIONS
// ----
// hunch: expressing everything in parsers will simplify data flow.
const func_shell = {
    start: and(t("func"), t("parens_open")),
    end: t("parens_close"),
}

const rangeArg = and(t("cell"), t("op_range"), t("cell"))
const Func_Range = {
    pattern: between(func_shell, rangeArg),
    toNode: {}, // (tokens: Token[]) => Node
}

const listArg = sepBy(t("cell"), t("op_list"))
const Func_List = {
    pattern: between(func_shell, listArg),
    toNode: {}, // (tokens: Token[]) => Node
}

// shorten parser name 'type' to 't' because it occurs so often.
function t(tokenType: TokenType): Parser {
    return (tokens) => {
        // START_HERE: go through claude's feedback, check tokens.length here, add types, put stuff in grammar.ts, and think about what to do next -- probably integrate the toNode functions
        return tokens[0].type === tokenType
            ? success({ match: [tokens[0]], rest: tokens.slice(1) })
            : createError({
                  expectedType: tokenType,
                  receivedToken: tokens[0],
                  index: 0,
              })
    }
}

function and(...parsers: Parser[]): Parser {
    return (tokens) => {
        let position = 0

        for (const parser of parsers) {
            const maybeMatch = parser(tokens.slice(position))
            if (!isSuccess(maybeMatch)) {
                return maybeMatch
            }
            position += maybeMatch.value.match.length
        }

        return success({
            match: tokens.slice(0, position),
            rest: tokens.slice(position),
        })
    }
}

// Alternative implementation
function and2(...parsers: Parser[]): Parser {
    return (tokens) => {
        const match = []
        let lastRest = tokens

        for (const parser of parsers) {
            const lastResult = parser(lastRest)
            if (!isSuccess(lastResult)) {
                return lastResult
            }
            lastRest = lastResult.value.rest
            match.push(...lastResult.value.match)
        }

        return success({
            match,
            rest: lastRest,
        })
    }
}

function between(
    { start, end }: { start: Parser; end: Parser },
    core: Parser,
): Parser {
    return (tokens) => {
        return and(start, core, end)(tokens)

        //     let position = 0
        //     const match = []
        //
        //     const maybeStart = start(tokens)
        //     if (!isSuccess(maybeStart)) {
        //         return maybeStart
        //     }
        // position += maybeStart.value.match.length
        //
        //
        //     const maybeCore = core(tokens.slice(position))
        //     if (!isSuccess(maybeCore)) {
        //         return maybeCore
        //     }
    }
}

function sepBy(core: Parser, separator: Parser): Parser {
    return (tokens) => {
        return and(core, zeroOrMore(and(separator, core)))(tokens)
    }
}

// This function does not return type 'Failure',
// just an empty array when there are 0 matches.
function zeroOrMore(p: Parser): Parser {
    return (tokens) => {
        const match = []
        let position = 0
        let currentSlice = tokens

        while (position < tokens.length) {
            const maybeMatch = p(currentSlice)

            if (!isSuccess(maybeMatch)) {
                break
            }

            // parsed successfully.
            // Add to matches and update position.
            match.push(...maybeMatch.value.match)
            position += maybeMatch.value.match.length
            currentSlice = maybeMatch.value.rest
        }

        return success({
            match,
            rest: tokens.slice(position),
        })
    }
}
