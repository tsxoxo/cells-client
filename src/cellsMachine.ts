import { setup, assign, assertEvent } from 'xstate'
import type { Cell, CleanToken } from './types'
import { ALPHABET_WITH_FILLER, NUM_OF_ROWS } from "./constants"
import { solveFormula, isFormula } from "./utils"

const INITIAL_CELLS = Array((ALPHABET_WITH_FILLER.length - 1) * NUM_OF_ROWS) as Cell[]
INITIAL_CELLS[0] = {
  value: '10',
  content: '10',
  cellsThatDependOnMe: []
}
INITIAL_CELLS[1] = {
  value: '11',
  content: '11',
  cellsThatDependOnMe: []
}
INITIAL_CELLS[100] = {
  value: '21',
  content: '=A0+A1',
  cellsThatDependOnMe: [0, 1]
}

interface Context { 'cells': Cell[] }


export const cellsMachine = setup({
  "types": {
    "context": {} as Context,
    "events": {} as {
      type: 'changeCell', cellID: number, input: string
    }
  },
  "actions": {
    "updateCell": assign(({ context, event }) => {
      assertEvent(event, 'changeCell');
      const updatedCell = structuredClone(context.cells[event.cellID]) ?? {}

      if (isFormula(event.input)) {
        const { error, cleanTokens, result } = solveFormula(event.input.slice(1), context.cells)

        if (error !== undefined) {
          console.log(`We've got an error -- keep calm and carry on!\nHere's the error message: ${error}`);
          updatedCell.value = event.input
        } else {
          updatedCell.value = String(result)
          // updateCells referenced in formula
          cleanTokens.forEach((cleanToken: CleanToken) => {
            if (cleanToken.indexOfOriginCell > -1) {
              // TODO: update all these cells as well
            }
          })
        }
      } else {
        updatedCell.value = String(event.input)
      }
      updatedCell.content = event.input

      return {
        cells: context.cells.toSpliced(event.cellID, 1, updatedCell)
      }
    }),
  }
})
  .createMachine({
    "context": {
      "cells": INITIAL_CELLS,
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
