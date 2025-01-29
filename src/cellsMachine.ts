import { setup, assign, assertEvent } from 'xstate'
import type { Cell } from './types'
import { ALPHABET_WITH_FILLER, NUM_OF_ROWS } from "./constants"
import { solveFormula, isFormula, updateCellDependencies, propagateChanges } from "./utils"

const INITIAL_CELLS = Array((ALPHABET_WITH_FILLER.length - 1) * NUM_OF_ROWS) as Cell[]
INITIAL_CELLS[0] = {
  value: '10',
  content: '10',
  tokens: [{ value: 10, indexOfOriginCell: -1 }],
  cellsThatDependOnMe: [2]
}
INITIAL_CELLS[1] = {
  value: '11',
  content: '11',
  tokens: [{ value: 11, indexOfOriginCell: -1 }],
  cellsThatDependOnMe: [2]
}
INITIAL_CELLS[2] = {
  value: '21',
  content: '=A0+A1',
  tokens: [
    { value: 10, indexOfOriginCell: 0 },
    { value: 11, indexOfOriginCell: 1 },
  ],
  cellsThatDependOnMe: [102]
}
INITIAL_CELLS[102] = {
  value: '31',
  content: '=A2+10',
  tokens: [
    { value: 21, indexOfOriginCell: 2 },
    { value: 10, indexOfOriginCell: -1 }
  ],
  cellsThatDependOnMe: []
}

interface Context { 'cells': Cell[] }


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
      const updatedCell = structuredClone(context.cells[event.indexOfCell]) ?? {}
      let updatedCells = structuredClone(context.cells)

      if (isFormula(event.input)) {
        const { error, cleanTokens, result } = solveFormula(event.input.slice(1), context.cells)
        if (error !== undefined) {
          console.log(`We've got an error -- keep calm and carry on!\nHere's the error message: ${error}`);
          updatedCell.value = event.input
        } else {
          updatedCell.value = String(result)
          updatedCell.tokens = cleanTokens
          // update cells referenced in formula
          updatedCells = updateCellDependencies(updatedCells, cleanTokens, event.indexOfCell)
        }
      } else {
        updatedCell.value = String(event.input)
      }
      updatedCell.content = event.input

      // TODO: Propagate changes 
      // updatedCells = propagateChanges(updatedCells, event.indexOfCell)

      return {
        cells: updatedCells.toSpliced(event.indexOfCell, 1, updatedCell)
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
