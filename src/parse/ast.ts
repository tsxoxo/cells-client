// =================================================
// AST-maker
// =================================================
//
// Takes an array of tokens,
// outputs a tree structure.
//
// Uses the grammar specified in ./types/grammar.ts

import { buildNode } from "./utils/ast_builders.ts"
import { FunctionKeyword } from "./utils/func.ts"
import {
    Failure,
    Result,
    fail,
    success,
    isSuccess,
    assertNever,
} from "./types/result"
import { ASTErrorType, ParseError } from "./types/errors.ts"
import { PATTERNS } from "./types/grammar.ts"
import { Token } from "./types/token.ts"
import { Node_Binary, Node } from "./types/ast.ts"
import { any, Parser as P } from "./utils/parse_combinators.ts"

export type ASTHandler = {
    tag: string
    parser: P
    toNode: (args: NodeBuilderArgs) => Node
}

type NodeBuilderArgs = {
    match: Token[]
    value: string
    start: number
}

export const parseTable = {
    func: [
        {
            tag: "func_range",
            parser: PATTERNS.FUNC_RANGE,
            toNode: (args: NodeBuilderArgs) => {
                // match == cell1:cell2
                const [from, , to] = args.match
                return buildNode.func({
                    value: args.value.toLowerCase() as FunctionKeyword,
                    start: args.start,
                    cells: [from, to].map((cellToken) =>
                        buildNode.cell(cellToken),
                    ),
                })
            },
        },
        {
            tag: "func_list",
            parser: PATTERNS.FUNC_LIST,
            toNode: (args: NodeBuilderArgs) => {
                // match == cell1(,cell2)*
                const cells = args.match.filter((token) => token.type == "cell")
                return buildNode.func({
                    value: args.value.toLowerCase() as FunctionKeyword,
                    start: args.start,
                    cells: cells.map((cellToken) => buildNode.cell(cellToken)),
                })
            },
        },
    ],
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
        expectedType,
    }: {
        type: ASTErrorType
        token: Token
        // TODO: expected should probably be TokenType
        expectedType: string | undefined
    }): Failure<ParseError> {
        const tokenDisplayString = token.type === "eof" ? "eof" : token.value
        return fail({
            type,
            token,
            msg: `${type} in makeAST: expected [${expectedType}], got [${tokenDisplayString}]`,
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
                    expectedType: "opening parenthesis",
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
                        expectedType: "closing parenthesis",
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
                // START_HERE: 07-13
                // * add tests for func_list

                const parseFunc = any(...parseTable.func)
                const parseResult = parseFunc(this.tokens.slice(this.current))
                if (!isSuccess(parseResult)) {
                    // TODO: Think about what to do with these errors
                    const { receivedToken: token, ...rest } =
                        parseResult.error[0]

                    return this.createError({
                        ...rest,
                        token,
                    })
                }

                // Happy path.
                // Transform result to Node
                const funcNode = parseResult.value.handler.toNode({
                    match: parseResult.value.match,
                    value: token.value,
                    start: token.start,
                })

                // Consume tokens: slice.length - rest.length
                const tokenSlice = this.tokens.slice(this.current)
                const numTokensToConsume =
                    tokenSlice.length - parseResult.value.rest.length
                for (let i = 0; i < numTokensToConsume; i++) {
                    this.consume()
                }

                return success(funcNode)
            }

            // Ran out of tokens unexpectedly.
            case "eof":
                return this.createError({
                    type: "UNEXPECTED_TOKEN",
                    token,
                    expectedType: "a factor",
                })

            // Unexpected token.type == something went seriously wrong in the tokenizer.
            // Unknown state, so we crash.
            default:
                assertNever("ast", "token.type", token.type as never)
        }
    }
}
