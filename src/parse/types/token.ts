//============================================================
// --- TOKENS ------------------------------------------------
//============================================================
export type TokenType =
    | "number"
    | "cell"
    | "op" // TODO: call this "op_bin"
    | "op_range"
    | "parens_open"
    | "parens_close"
    | "func_range"
    | "func"
    | undefined // Used for INVALID_CHAR error and as initial value in factory function.
    | "eof" // Used for end-of-file error

export type Token = {
    value: string
    type: TokenType
    start: number
}
