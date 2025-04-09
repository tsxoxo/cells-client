import { setup, assign, assertEvent } from 'xstate'
import type { Cell, AppError } from './types'
import { INITIAL_CELLS } from "./INITIAL_DATA";
import { parseInput, withUpdatedCellDependencies, withPropagatedChanges } from "./utils"

interface Context { 'cells': Cell[], errors: AppError[] }

export const cellsMachine = setup({
  "types": {
    "context": {} as Context,
    "events": {} as {
      type: 'changeCell', indexOfCell: number, input: string
    }
  },
  "actions": {
    "updateCell": assign(({ context, event }) => {
      assertEvent(event, 'changeCell');

      let errors = structuredClone(context.errors)
      const { errorMessage: inputErrorMessage, cleanTokens: tokens, value } = parseInput(event.input, context.cells)

      const updatedCell: Cell = {
        content: event.input,
        value,
        tokens,
        cellsThatDependOnMe: context.cells[event.indexOfCell]?.cellsThatDependOnMe || [],
      }
      const cellsWithUpdatedCell = context.cells.toSpliced(event.indexOfCell, 1, updatedCell)
      const cellsWithUpdatedCellAndDependencies = withUpdatedCellDependencies(
        cellsWithUpdatedCell,
        context.cells[event.indexOfCell]?.tokens || [],
        event.indexOfCell
      )

      const { errors: propagationErrors, cellsAfterPropagation } = withPropagatedChanges(cellsWithUpdatedCellAndDependencies, event.indexOfCell)

      if (inputErrorMessage !== '') {
        errors = [...errors, {
          indexOfCell: event.indexOfCell,
          message: inputErrorMessage
        }]
      }
      errors = [...errors, ...propagationErrors]

      return {
        cells: cellsAfterPropagation,
        errors
      }
    }),
  }
})
  .createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QGEwBs2wHQCcwEMIBPAYgGMALfAOxlQwG0AGAXUVAAcB7WASwBdeXauxAAPRABYATABoQRRAA4AjFgCsAX23zqXCHFH1Mo7n0HDREhAFoAbPMW27OkMex5CTzjwFCRSOKIdgDMWEoAnEqSIQDs6o6IKkrSGrGq0lramkA */
    "context": {
      "cells": INITIAL_CELLS,
      "errors": []
    },
    "id": "Cells",
    "initial": "ready",
    "states": {
      "ready": {
        "on": {
          "changeCell": {
            "target": "ready",
            "actions": {
              "type": "updateCell"
            }
          },
        }
      },
    }
  })
