import { ParseError } from "../parse/types/errors"

export type AppError = {
    cellIndex: number
    cause: ParseError
}

export function handleErrors(errors: AppError[]) {
    if (errors.length > 0) {
        errors.forEach((error) => {
            console.log(`errors: ${JSON.stringify(error, null, 2)}`)
            //console.log(`We've got an error in cell ${error.indexOfCell} -- keep calm and carry on!\nHere's the error message: ${error.message}`)
        })
    }
}
