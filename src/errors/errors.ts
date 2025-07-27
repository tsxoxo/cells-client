import { ParseError } from "../parse/types/errors"

// TODO: Do we need this now we have UIError?
export type AppError = {
    cellIndex: number
    cause: ParseError
}

// Bare necessities for showing expressive errors.
// Derived from ParseError through an interface.
// We don't want this to be coupled too tightly to ParseError
// because we'll be sending this to the BE and that would
// make our API dependent on implementation details of the
// parser.
type UIError = {
    msg: string
    token: {
        start: number
        value: string
    }
    cellIndex: number
}

// export function makeUIError({type, token, cellIndex}: {
//   type: ParseEr,
//   payload: Parse,
//   cellIndex: number
// })

export function handleErrors(errors: AppError[]) {
    if (errors.length > 0) {
        errors.forEach((error) => {
            console.log(`errors: ${JSON.stringify(error, null, 2)}`)
            //console.log(`We've got an error in cell ${error.indexOfCell} -- keep calm and carry on!\nHere's the error message: ${error.message}`)
        })
    }
}
