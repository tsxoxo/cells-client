import { Result, fail, success, isSuccess, Failure } from "../types/result"
import { Token, TokenType } from "../types/token"
import { ASTErrorType } from "../types/errors"

//============================================================
// TYPES
//============================================================
type Parser = (tokens: Token[]) => ParseResult
type ParseError = {
    type: ASTErrorType
    expectedType: TokenType
    receivedToken: Token
    index: number
}
type ParseResult = Result<{ match: Token[]; rest: Token[] }, ParseError>

//============================================================
// PARSERS
//============================================================
// Match single token based on [t]ype
// (Shorten 'type' to 't' because this parser occurs so often.)
export function t(tokenType: TokenType): Parser {
    return (tokens) => {
        if (tokens.length === 0) {
            return createError({
                expectedType: tokenType,
                receivedToken: {
                    type: "eof",
                    value: "",
                    start: -1,
                },
                index: 0,
            })
        }

        return tokens[0].type === tokenType
            ? success({ match: [tokens[0]], rest: tokens.slice(1) })
            : createError({
                  expectedType: tokenType,
                  receivedToken: tokens[0],
                  index: 0,
              })
    }
}

// Match a sequence.
export function and(...parsers: Parser[]): Parser {
    return (tokens) => {
        const match = []
        let nextTokens = tokens

        for (const parser of parsers) {
            const parseResult = parser(nextTokens)

            // NOTE: will have to deal with returning index at some point
            if (!isSuccess(parseResult)) {
                return parseResult
            }

            // Happy path.
            // Add match to result array and set input for next parser.
            nextTokens = parseResult.value.rest
            match.push(...parseResult.value.match)
        }

        return success({
            match,
            rest: nextTokens,
        })
    }
}

// Match 0 or more of a pattern.
// When there are 0 matches, return an empty array.
// (This export function does not return type 'Failure')
export function zeroOrMore(p: Parser): Parser {
    return (tokens) => {
        const match = []
        let nextSlice = tokens

        while (nextSlice.length > 0) {
            const maybeMatch = p(nextSlice)

            if (!isSuccess(maybeMatch)) {
                break
            }

            // parsed successfully.
            // Add to matches and update position.
            match.push(...maybeMatch.value.match)
            nextSlice = maybeMatch.value.rest
        }

        return success({
            match,
            rest: nextSlice,
        })
    }
}

// Match a sequence in between other stuff.
// Return only the matched core.
//
// Example, simplified:
// IN: pattern: (func_shell, func_arg_range), tokens:('sum(a1:a2)')
// OUT: [a1, a2]
export function between(
    { start, end }: { start: Parser; end: Parser },
    core: Parser,
): Parser {
    return (tokens) => {
        // naive approach.
        // we actually want to only return the matched core tokens
        // return and(start, core, end)(tokens)

        const maybeStart = start(tokens)
        if (!isSuccess(maybeStart)) {
            return maybeStart
        }

        const maybeCore = core(maybeStart.value.rest)
        if (!isSuccess(maybeCore)) {
            return maybeCore
        }

        const maybeEnd = end(maybeCore.value.rest)
        if (!isSuccess(maybeEnd)) {
            return maybeEnd
        }

        // Happy path.
        // We extract
        return success({
            match: maybeCore.value.match,
            rest: maybeEnd.value.rest,
        })
    }
}

export function sepBy(core: Parser, separator: Parser): Parser {
    return (tokens) => {
        //prettier-ignore
        return and(
          core,
          zeroOrMore(and(separator, core))
        )(tokens)
    }
}

// TODO: think: do we need this?
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

//============================================================
// MAP
//============================================================
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

//============================================================
// ERROR
//============================================================
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
