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
import { makeTransformer } from "./utils/parse_combinators.ts"

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
        receivedToken,
        expectedType,
    }: {
        type: ASTErrorType
        receivedToken: Token
        // TODO: expected should probably be TokenType
        expectedType: string | undefined
    }): Failure<ParseError> {
        const tokenDisplayString =
            receivedToken.type === "eof" ? "eof" : receivedToken.value
        return fail({
            type,
            payload: receivedToken,
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
                    receivedToken: token,
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
                        receivedToken: this.peek(),
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
                const tokenToNode_funcRange = makeTransformer(
                    PATTERNS.FunctionRange.pattern.map(({ type }) => type),
                    (match: Token[]) => {
                        const [cellTokenA, cellTokenB] =
                            PATTERNS.FunctionRange.extract(match)

                        return buildNode.func_range({
                            // TODO: get rid of cast
                            value: token.value.toLowerCase() as FunctionKeyword,
                            start: token.start,
                            from: buildNode.cell(cellTokenA),
                            to: buildNode.cell(cellTokenB),
                        })
                    },
                )

                const tokenSlice = this.tokens.slice(this.current)
                const parseFuncRange = tokenToNode_funcRange(tokenSlice)

                if (!isSuccess(parseFuncRange)) {
                    return this.createError(parseFuncRange.error)
                }

                // START_HERE:
                // read through chatgpt chat 'fold vs. collect in fp', starting at heading '1. What do I mean by “invert control” in fromPattern()?'
                // * think through adding func_list
                //
                // big picture:
                // in ast.ts:
                // explained:
                // 1. call a function with IN==Token[] and OUT=Node
                // 2. try parsing range syntax => return success or continue
                // 2a. check tokens against hard-coded pattern -- easy.
                // 3. try parsing list syntax => return success or fail
                // 3b. try parsing single cell
                // 3c. try parsing ", cell"
                // 3d. when 3c fails, try parsing ')'
                //
                // pseudo-code:
                // const func_range = matchPattern(PATTERNS.FunctionRange.pattern)
                // const func_list = matchPattern(PATTERNS.FunctionList.pattern)
                // const parseFunc  = choice(func_range, func_list)
                // const maybeListOfCells = parseFunc(this.tokens.slice(this.current))
                //
                // with this approach, both range and list functions would produce the same type of node,
                // containing a list of cell values
                // PROs:
                // simple
                // CONs?:
                // * lose differentiation -- but I'm not sure what we could need that for
                // * parser would become slightly more coupled with cells data structure (it would have to call getCellsInRange) -- but I'm not sure that's so bad since that is a pure function
                //
                // big question:
                // the pattern
                // BNF: keyword ( cell (, cell)* )
                // hunch: the pattern could be a function ?
                // func_range.pattern: return an static array?
                // for func_list:
                //
                // simplified problem:
                // write just one of these parsers: many, sequence

                // Consume tokens: slice.length-rest.length
                const numTokensToConsume =
                    tokenSlice.length - parseFuncRange.value.rest.length

                for (let i = 0; i < numTokensToConsume; i++) {
                    this.consume()
                }

                return success(parseFuncRange.value.result)
            }

            // Ran out of tokens unexpectedly.
            case "eof":
                return this.createError({
                    type: "UNEXPECTED_TOKEN",
                    receivedToken: token,
                    expectedType: "a factor",
                })

            // Unexpected token.type == something went seriously wrong in the tokenizer.
            // Unknown state, so we crash.
            default:
                assertNever("ast", "token.type", token.type as never)
        }
    }

    // private parseFunc(): Result<
    //     { from: Node_Cell; to: Node_Cell },
    //     ParseError
    // > {
    //     // match incoming tokens against function pattern
    //     for (let i = 0; i < PATTERNS.function_range.length; i++) {
    //         const token = this.peek()
    //
    //         // Fail fast.
    //         if (token.type !== PATTERNS.function_range[i].type) {
    //             return this.createError({
    //                 type: "UNEXPECTED_TOKEN",
    //                 token,
    //                 expected: `token of type ${PATTERNS.function_range[i].type} while parsing function pattern (for example 'sum(a1:z99)')`,
    //             })
    //         }
    //
    //         // Happy path.
    //         // Save cell refs and advance token stream.
    //         if (token.type === "cell") {
    //             toAndFromCells.push({
    //                 type: "cell" as const,
    //                 value: token.value,
    //                 start: token.start,
    //             })
    //         }
    //
    //         this.consume()
    //     }
    //
    //     // No errors. return cell nodes.
    //     return success({
    //         from: toAndFromCells[0],
    //         to: toAndFromCells[1],
    //     })
    // }
}
