import { UIError } from "../errors/errors"
import { Cell } from "./types"

export type Payload = {
    newCells: Cell[]
    oldCells: Cell[]
    errors?: UIError[]
}
