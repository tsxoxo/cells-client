// =================================================
// AST-maker
// =================================================
//
// Takes an array of tokens,
// outputs a tree structure.
//
// Uses the grammar specified in ./types/grammar.ts

import { tokenize } from "./tokenize.ts"
import {
    Failure,
    Result,
    fail,
    success,
    isSuccess,
    ASTErrorType,
    ParseError,
    assertNever,
    assertIsSuccess,
} from "./types/errors.ts"
import {
    Node_Binary,
    Node_Cell,
    Token,
    Node,
    PATTERNS,
    Node_Func,
    TokenType,
} from "./types/grammar.ts"

type ParseResult = Result<{ match: Token[]; rest: Token[] }, { msg: string }>

// Take in pattern, match against stream of Token[]
function matchTokenTypes(
    expected: TokenType[],
): (tokens: Token[]) => ParseResult {
    return (tokens) => {
        if (expected.length === 0) {
            return fail({
                msg: "Received empty array for parameter 'expected'",
            })
        }

        // Compare tokens with expected one by one, the old-fashioned way.
        // Fail fast.
        for (let i = 0; i < expected.length; i++) {
            if (tokens[i].type !== expected[i]) {
                return fail({
                    msg: `Pattern did not match at index [${i}]. Expected [${expected[i]}]. Got [${tokens[i].type}] instead.`,
                })
            }
        }

        return success({
            match: tokens.slice(0, expected.length),
            rest: tokens.slice(expected.length),
        })
    }
}

function map<A>(
    parser: (pattern: TokenType[]) => ParseResult,
    mapFn: (tokens: Token[]) => A,
): (
    pattern: TokenType[],
) => Result<{ result: A; rest: Token[] }, { msg: string }> {
    return (tokens) => {
        const parseResult = parser(tokens)
        if (!isSuccess(parseResult)) {
            return fail({ msg: "Couldnt do it" })
        }

        const { match, rest } = parseResult.value

        return success({
            result: mapFn(match),
            rest,
        })
    }
}
//

// in-source test suites
if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest

    it("func_matchTypes", () => {
        const func_pattern = matchTokenTypes(
            PATTERNS.function.map(({ type }) => type),
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

    // START_HERE:
    // * write test for map
    // * try to recreate that clever builder thing with (_, __, cell1, ___, cell2, ____)
    // so mb P_FUNC_WITH_RANGE = {pattern, builder}
}

export class Parser {
    readonly tokens: Token[]
    current: number
    readonly eofToken: Token = {
        value: "",
        type: "eof",
        start: -1,
    }

    constructor(tokens: Token[]) {
        this.tokens = tokens
        this.current = 0
    }

    // Main function
    makeAST(): Result<Node, ParseError> {
        const result = this.parseExpression()

        return result
    }

    private createError({
        type,
        token,
        expected,
    }: {
        type: ASTErrorType
        token: Token
        expected: string
    }): Failure<ParseError> {
        const tokenDisplayString = token.type === "eof" ? "eof" : token.value
        return fail({
            type,
            payload: token,
            msg: `${type} in makeAST: expected [${expected}], got [${tokenDisplayString}]`,
        })
    }

    private peek() {
        if (this.current >= this.tokens.length) {
            // Return special "eof" token -- that seems simpler than handling a null value.
            return this.eofToken
        }
        return this.tokens[this.current]
    }

    private consume() {
        if (this.current >= this.tokens.length) {
            // Return special "eof" token -- that seems simpler than handling a null value.
            return this.eofToken
        }
        this.current++
        return this.tokens[this.current - 1]
    }

    private parseExpression(): Result<Node, ParseError> {
        const expr = this.parseTerm()
        let exprBinary: Node_Binary | undefined = undefined

        if (!isSuccess(expr)) {
            return expr
        }

        while (this.peek()?.type === "op") {
            const token = this.peek()
            if (token?.value === "+" || token?.value === "-") {
                const op = token?.value as string
                this.consume()

                const right = this.parseTerm()

                if (!isSuccess(right)) {
                    return right
                }

                exprBinary = {
                    type: "binary_op" as const,
                    value: op,
                    start: expr.value.start,
                    left: exprBinary ? exprBinary : expr.value,
                    right: right.value,
                }
            } else {
                break
            }
        }

        return exprBinary ? success(exprBinary) : expr
    }

    private parseTerm(): Result<Node, ParseError> {
        const term = this.parseFactor()
        let termBinary: Node_Binary | undefined = undefined

        if (!isSuccess(term)) {
            return term
        }

        while (this.peek()?.type === "op") {
            const op = this.peek()
            if (op?.value === "*" || op?.value === "/") {
                this.consume()

                // 'term', defined above, is the left-hand part of the potential term
                const right = this.parseFactor()

                if (!isSuccess(right)) {
                    return right
                }

                termBinary = {
                    type: "binary_op" as const,
                    value: op.value,
                    start: term.value.start,
                    left: termBinary ? termBinary : term.value,
                    right: right.value,
                }
            } else {
                // is op, but not mult or div
                break
            }
        }

        // Success state
        // (term is already a Result type so no need to wrap it)
        return termBinary ? success(termBinary) : term
    }

    private parseFactor(): Result<Node, ParseError> {
        const token = this.peek()

        // Expect any type of token.
        switch (token.type) {
            case "number":
                this.consume()

                return success({
                    type: "number",
                    value: token.value,
                    start: token.start,
                })

            case "cell":
                this.consume()

                return success({
                    type: "cell",
                    value: token.value,
                    start: token.start,
                })

            case "parens_close": {
                return this.createError({
                    type: "PARENS",
                    token,
                    expected: "opening parenthesis",
                })
            }

            case "parens_open": {
                // Save bracket position.
                const bracketOpenPosition = token.start
                // Consume bracket.open and parse expression.
                this.consume()
                const expr = this.parseExpression()

                // Expect bracket.close
                if (this.peek()?.value !== ")") {
                    return this.createError({
                        type: "PARENS",
                        token: this.peek(),
                        expected: "closing parenthesis",
                    })
                }

                // Happy path.
                if (isSuccess(expr)) {
                    // Update expr with opening and closing bracket positions.
                    expr.value.start = bracketOpenPosition
                }
                // Consume closing bracket and return
                this.consume()
                return expr
            }

            case "func": {
                const maybeCells = this.parseFunc()

                if (!isSuccess(maybeCells)) {
                    return maybeCells
                }

                return success({
                    type: "func",
                    value: token.value.toLowerCase(),
                    start: token.start,
                    ...maybeCells.value,
                } as Node_Func)
            }

            // Ran out of tokens unexpectedly.
            case "eof":
                return this.createError({
                    type: "UNEXPECTED_TOKEN",
                    token,
                    expected: "a factor",
                })

            // Unexpected token.type == something went seriously wrong in the tokenizer.
            // Unknown state, so we crash.
            default:
                assertNever("ast", "token.type", token.type as never)
        }
    }

    private parseFunc(): Result<
        { from: Node_Cell; to: Node_Cell },
        ParseError
    > {
        // Initialize result container for cell refs in function expression.
        // Example: if IN='sum(a1:z99)', this will hold [a1, z99]
        const toAndFromCells = [] as Node_Cell[]

        // match incoming tokens against function pattern
        for (let i = 0; i < PATTERNS.function.length; i++) {
            const token = this.peek()

            // Fail fast.
            if (token.type !== PATTERNS.function[i].type) {
                return this.createError({
                    type: "UNEXPECTED_TOKEN",
                    token,
                    expected: `token of type ${PATTERNS.function[i].type} while parsing function pattern (for example 'sum(a1:z99)')`,
                })
            }

            // Happy path.
            // Save cell refs and advance token stream.
            if (token.type === "cell") {
                toAndFromCells.push({
                    type: "cell" as const,
                    value: token.value,
                    start: token.start,
                })
            }

            this.consume()
        }

        // No errors. return cell nodes.
        return success({
            from: toAndFromCells[0],
            to: toAndFromCells[1],
        })
    }
}
