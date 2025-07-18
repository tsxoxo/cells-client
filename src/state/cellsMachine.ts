import { setup, assign, fromPromise, assertEvent } from "xstate"
import type { Cell } from "../types/types"
import { INITIAL_CELLS } from "../test/INITIAL_DATA"
import { handleCellContentChange } from "./state"
import { Result, fail, isSuccess, success } from "../parse/types/result"
import { AppError } from "../errors/errors"

type Payload = {
    newCells: Cell[]
    oldCells: Cell[]
    error?: AppError
}

export interface Context {
    cells: Cell[]
    errors: AppError[]
    pendingSubmissions: Payload[]
}

export type ChangeCell = {
    type: "changeCell"
    cellIndex: number
    value: string
}

async function submit(payload: Payload[]): Promise<Result<unknown, Error>> {
    const url = `http://localhost:3000/cells`
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                payload,
            }),
        })

        if (!res.ok) {
            throw new Error(`Response status: ${res.status}`)
        }
        const json = await res.json()

        return success(json)
    } catch (e) {
        return fail(e as Error)
    }
}

export const cellsMachine = setup({
    types: {
        context: {} as Context,
        events: {} as ChangeCell | { type: "RETRY" },
    },
    actions: {
        setPending: assign(({ context, event }) => {
            assertEvent(event, "changeCell")
            const updatedCellsResult = handleCellContentChange(context, event)
            const newCells = [] as Cell[]

            // create payload by adding old cells
            // NOTE: I know this function is doing a lot
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
                            error: updatedCellsResult.error,
                        }),
                    },
                ],
            }
        }),
        cleanPending: assign(() => {
            return {
                pendingSubmissions: [],
            }
        }),

        setCell: assign(({ context, event }) => {
            // BUG:
            // typeof event is not being inferred correctly
            // DIAGNOSTIC: 1. Property 'output' does not exist on type 'ChangeCell | { type: "RETRY"; }'.
            console.log(`server sent back ${JSON.stringify(event.output)}`)
            return { cells: context.cells }
            // START_HERE: 07-17
            // * what to return here?
            // * how do we handle server time out?
            // * start with action plan from claude chat 'back end 1', heading 'Next Session Action Plan' (last message)
            // return isSuccess(result)
            //     ? { cells: result.value }
            //     : { errors: [result.error] }
        }),

        setError: assign(({ context, event }) => {
            // BUG:
            // typeof event is not being inferred correctly
            // DIAGNOSTIC: 1. Property 'error' does not exist on type 'ChangeCell | { type: "RETRY"; }'.
            return { errors: [...context.errors, event.error] }
        }),
    },
    actors: {
        submit: fromPromise(
            // prettier-ignore
            async ({ input: { pendingSubmissions }, }: { input: { pendingSubmissions: Payload[] } }) => {
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
    },
    id: "Cells",
    initial: "idle",
    states: {
        idle: {
            on: {
                changeCell: {
                    target: "submitting",
                },
            },
        },
        submitting: {
            entry: [
                {
                    type: "setPending",
                },
            ],
            exit: [
                {
                    type: "cleanPending",
                },
            ],
            invoke: {
                id: "submit",
                input: ({ context: { pendingSubmissions } }) => ({
                    pendingSubmissions,
                }),
                onDone: {
                    target: "idle",
                    actions: {
                        type: "setCell",
                    },
                },
                onError: {
                    target: "submit_fail",
                    actions: {
                        type: "setError",
                    },
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
