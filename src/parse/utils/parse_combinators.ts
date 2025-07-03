import { tokenize } from "../tokenize"
import {
    Result,
    fail,
    success,
    isSuccess,
    assertIsSuccess,
} from "../types/result"
import { PATTERNS } from "../types/grammar"
import { Token, TokenType } from "../types/token"

type Parser = (tokens: Token[]) => ParseResult
type ParseError = {
    expectedType: TokenType
    received: Token
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
                    expectedType: expected[i]!,
                    received: {
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
                    expectedType: expected[i]!,
                    received: tokens[i],
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
