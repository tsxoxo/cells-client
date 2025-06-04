import { ParseError } from "./parse/types/errors"

export type AppError = {
  indexOfCell: number
  cause: ParseError
}

export function handleErrors(errors: AppError[]) {
  if (errors.length > 0) {
    errors.forEach((error) => {
      console.log(`errors: ${JSON.stringify(error)}`)
      //console.log(`We've got an error in cell ${error.indexOfCell} -- keep calm and carry on!\nHere's the error message: ${error.message}`)
    })
  }
}
