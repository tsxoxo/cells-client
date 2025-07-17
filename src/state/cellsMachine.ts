import { setup, assign, fromPromise, assertEvent } from "xstate"
import type { Cell } from "../types/types"
import { INITIAL_CELLS } from "../test/INITIAL_DATA"
import { handleCellContentChange } from "./state"
import { Result, fail, isSuccess, success } from "../parse/types/result"
import { AppError } from "../errors/errors"

export interface Context {
    cells: Cell[]
    errors: AppError[]
    submittingCells: number[]
    pendingSubmissions: Cell[]
}

export type ChangeCell = {
    type: "changeCell"
    indexOfCell: number
    value: string
}

async function submitCells(
    cells: Cell[],
    index: number,
): Promise<Result<{}, Error>> {
    const url = `http://localhost:3000/cells/${index}`
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                cells,
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
        parseInput: assign(({ context, event }) => {
            assertEvent(event, "changeCell")
            const result = handleCellContentChange(context, event)

            return isSuccess(result)
                ? { pendingSubmissions: result.value.cells }
                : { errors: [result.error] }
        }),
        // NOTE: do we need submittingCells AND pendingSubmissions?
        // setSubmittingCells: assign(({ context, event }) => {
        //     const result = handleCellContentChange(context, event)
        //
        //     return isSuccess(result)
        //         ? { cells: result.value }
        //         : { errors: [result.error] }
        // }),

        setCell: assign(({ context, event }) => {
            console.log("in setCell!!!")
            console.log(event.output)

            return { cells: context.cells }
            // START_HERE: what to return here?
            // return isSuccess(result)
            //     ? { cells: result.value }
            //     : { errors: [result.error] }
        }),

        setError: assign(({ context, event }) => {
            const result = handleCellContentChange(context, event)

            return isSuccess(result)
                ? { cells: result.value }
                : { errors: [result.error] }
        }),
    },
    actors: {
        submitCell: fromPromise(
            async ({ input }: { input: { pendingSubmissions: Cell[] } }) => {
                const response = await submitCells(input.pendingSubmissions, 12)

                return response
            },
        ),
    },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QGEwBs2wHQCcwEMIBPAYgGMALfAOxlQwG0AGAXUVAAcB7WASwBdeXauxAAPRABYATABoQRRAA4AjFgCsAX23zqXCHFH1Mo7n0HDREhAFoAbPMW27OkMex5CTzjwFCRSOKIdgDMWEoAnEqSIQDs6o6IKkrSGrGq0lramkA */
    context: {
        cells: INITIAL_CELLS,
        submittingCells: [],
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
                    type: "parseInput",
                },
                // {
                //     type: "setSubmittingCells",
                // },
            ],
            invoke: {
                id: "submitCell",
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
                src: "submitCell",
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
