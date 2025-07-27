import { setup, assign, fromPromise, assertEvent, raise } from "xstate"
import type { Cell } from "../types/types"
import { INITIAL_CELLS } from "../test/INITIAL_DATA"
import { handleCellContentChange } from "./state"
import { assertIsSuccess, isSuccess } from "../parse/types/result"
import { UIError } from "../errors/errors"
import { submit } from "../io/fetch"
import { Payload } from "../types/io"

const STATUS_CLEAR_DELAY = 3000

export interface Context {
    cells: Cell[]
    errors: UIError[]
    pendingSubmissions: Payload[]
    feedback: {
        type: "none" | "success" | "error"
        message: string
        timestamp: number
    }
}

export type ChangeCell = {
    type: "CHANGE_CELL"
    cellIndex: number
    value: string
}

export const cellsMachine = setup({
    types: {
        context: {} as Context,
        events: {} as
            | ChangeCell
            | { type: "RETRY" }
            | { type: "CLEAR_FEEDBACK" },
    },
    actions: {
        setPending: assign(({ context, event }) => {
            assertEvent(event, "CHANGE_CELL")
            const updatedCellsResult = handleCellContentChange(context, event)
            const newCells = [] as Cell[]

            // create payload by adding old cells
            // NOTE: I know this function is doing a lot
            // TODO: This is unreadable
            if (!isSuccess(updatedCellsResult)) {
                const faultyCell = structuredClone(
                    context.cells[event.cellIndex],
                )
                faultyCell.content = event.value

                newCells.push(faultyCell)
            } else {
                newCells.push(...updatedCellsResult.value.cells)
            }

            const oldCells = newCells.map(
                (updatedCell) => context.cells[updatedCell.ownIndex],
            )

            return {
                pendingSubmissions: [
                    ...context.pendingSubmissions,
                    {
                        newCells,
                        oldCells,
                        ...(!isSuccess(updatedCellsResult) && {
                            errors: [updatedCellsResult.error],
                        }),
                    },
                ],
            }
        }),
        cleanPending: assign(() => {
            return { pendingSubmissions: [] }
        }),
    },
    actors: {
        submit: fromPromise(
            // prettier-ignore
            async ({ input: { pendingSubmissions } }:
                    { input: { pendingSubmissions: Payload[] } }) => {
                const response = await submit(pendingSubmissions)

                return response
            },
        ),
    },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QGEwBs2wHQCcwEMIBPAYgGMALfAOxlQwG0AGAXUVAAcB7WASwBdeXauxAAPRABYATABoQRRAA4AjFgCsAX23zqXCHFH1Mo7n0HDREhAFoAbPMW27OkMex5CTzjwFCRSOKIdgDMWEoAnEqSIQDs6o6IKkrSGrGq0lramkA */
    context: {
        cells: INITIAL_CELLS,
        pendingSubmissions: [],
        errors: [],
        feedback: {
            type: "none",
            message: "",
            timestamp: Date.now(),
        },
    },
    id: "Cells",
    initial: "idle",
    on: {
        CLEAR_FEEDBACK: {
            // No target
            actions: assign({
                feedback: () => ({
                    type: "none",
                    message: "",
                    timestamp: Date.now(),
                }),
            }),
        },
    },

    states: {
        idle: {
            on: {
                CHANGE_CELL: {
                    target: "submitting",
                },
            },
        },
        submitting: {
            entry: [{ type: "setPending" }],
            exit: [{ type: "cleanPending" }],
            invoke: {
                id: "submit",
                input: ({ context: { pendingSubmissions } }) => ({
                    pendingSubmissions,
                }),
                onDone: {
                    target: "idle",
                    actions: [
                        // DEBUG: log response
                        // prettier-ignore
                        ({ event }) => { 
              console.log( `server sent back ${JSON.stringify(event.output)}`) 
                        },
                        // setCell
                        // Update context based on server response.
                        // The response is either:
                        // * A mirror of the request payload,
                        // * or an OK status and we set based on pendingSubmissions
                        // For now, it's a mirror
                        assign({
                            cells: ({ context, event }) => {
                                if (!isSuccess(event.output)) {
                                    // TODO: deal with this later
                                }
                                // For some reason, TS doesn't infer this on its own.
                                assertIsSuccess(event.output)
                                // assume it's an array with a single cell
                                const i = event.output.value[0].ownIndex
                                return context.cells.toSpliced(
                                    i,
                                    1,
                                    event.output.value[0],
                                )
                            },
                            feedback: () => ({
                                type: "success",
                                // TODO: get this string from ui_strings.js
                                message: "Saved",
                                timestamp: Date.now(),
                            }),
                        }),
                        raise(
                            { type: "CLEAR_FEEDBACK" },
                            { delay: STATUS_CLEAR_DELAY },
                        ),
                    ],
                },
                onError: {
                    target: "submit_fail",
                    actions: [
                        // prettier-ignore
                        ({ event }) => { 
              console.log( `Error: ${JSON.stringify(event.error)}`) 
                        },
                    ],
                },
                src: "submit",
            },
        },
        submit_fail: {
            on: {
                RETRY: {
                    target: "submitting",
                },
            },
        },
    },
})
