import { AppError } from "../errors/errors"
import { Cell } from "./types"

export type Payload = {
    newCells: Cell[]
    oldCells: Cell[]
    error?: AppError
}
