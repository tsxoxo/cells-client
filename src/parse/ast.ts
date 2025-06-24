// =================================================
// AST-maker
// =================================================
//
// Takes an array of tokens,
// outputs a tree structure.
//
// Uses the grammar specified in ./types/grammar.ts

import { FunctionKeyword } from "./func.ts"
import {
    Failure,
    Result,
    fail,
    success,
    isSuccess,
    ASTErrorType,
    ParseError,
    assertNever,
} from "./types/errors.ts"
import { Node_Binary, Node_Cell, Token, Node } from "./types/grammar.ts"

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
                // Consume function keyword
                this.consume()

                // Expect "("
                const next = this.peek()

                if (next.value !== "(") {
                    return this.createError({
                        type: "PARENS",
                        token: next,
                        expected: "bracket after function keyword",
                    })
                }

                // Happy path: consume bracket.
                this.consume()
                // Expect range.
                const range = this.parseRange()

                // Error path: Not a valid range.
                if (range.ok === false) {
                    return range
                }

                // Happy path. Expect bracket.close
                if (this.peek()?.value !== ")") {
                    return this.createError({
                        type: "PARENS",
                        token: this.peek()!,
                        expected: "closing bracket of function expression",
                    })
                }

                // Happy path: consume bracket.close and return
                this.consume()

                return success({
                    type: "func",
                    value: token.value.toLowerCase() as FunctionKeyword,
                    start: token.start,
                    ...range.value,
                })
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

    // Function to parse range syntax, as in "SUM(A1:Z99)".
    // Happy path: the next sequence of tokens is <cell_ref>, ":", <cell_ref>
    private parseRange(): Result<
        { from: Node_Cell; to: Node_Cell },
        ParseError
    > {
        const maybeFirstCell = this.peek()

        // Happy path
        // Expect sequence `<cell_ref>, ":", <cell_ref>`
        if (maybeFirstCell?.type === "cell") {
            this.consume()
            if (this.peek()?.value === ":") {
                this.consume()
                if (this.peek()?.type === "cell") {
                    const from = {
                        type: "cell" as const,
                        value: maybeFirstCell!.value,
                        start: maybeFirstCell.start,
                    }

                    const to = {
                        type: "cell" as const,
                        value: this.peek()!.value,
                        start: this.peek()!.start,
                    }

                    this.consume()

                    return success({
                        from,
                        to,
                    })
                }
            }
        }

        // Error path.
        // We ran out of tokens or a token did not match range syntax
        return this.createError({
            type: "UNEXPECTED_TOKEN",
            token: this.peek(),
            expected: "valid range syntax",
        })
    }
}
