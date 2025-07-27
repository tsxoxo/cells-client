import { ParseErrorType } from "../parse/types/errors"
import { Token } from "../parse/types/token"

// Bare necessities for showing expressive errors.
// Derived from ParseError through an interface.
// We don't want this to be coupled too tightly to ParseError
// because we'll be sending this to the BE and that would
// make our API dependent on implementation details of the
// parser.
export type UIError = {
    msg: string
    token: {
        start: number
        value: string
    }
    cellIndex: number
}

export function createUIError({
    type,
    token,
    cellIndex,
}: {
    type: ParseErrorType
    // TODO: THis is not completely true since in interpret.ts we are losing the `type` prop
    token: Pick<Token, "start" | "value">
    cellIndex: number
}): UIError {
    return {
        msg: type,
        token: {
            start: token.start,
            value: token.value,
        },
        cellIndex,
    }
}

export function handleErrors(errors: UIError[]) {
    if (errors.length > 0) {
        errors.forEach((error) => {
            console.log(`errors: ${JSON.stringify(error, null, 2)}`)
            //console.log(`We've got an error in cell ${error.indexOfCell} -- keep calm and carry on!\nHere's the error message: ${error.message}`)
        })
    }
}
