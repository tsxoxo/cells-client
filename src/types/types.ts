import type { InjectionKey } from "vue"
import type { cellsMachine } from "../state/cellsMachine"
import { useMachine } from "@xstate/vue"

export const CELLS_MACHINE_KEY: InjectionKey<
    ReturnType<typeof useMachine<typeof cellsMachine>>
> = Symbol("cellsMachine")

export interface Cell {
    // raw user input
    content: string
    // only set when formula is successfully interpreted
    value: number | undefined
    // indices of cells used in formula
    dependencies: number[]
    // cells that reference this cell
    dependents: number[]
    ownIndex: number
    // used for debug and experimentation
    // could be used to store things like own index, own name, PosX
    _data?: Record<string, unknown>
}
