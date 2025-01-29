import { setup, assign, assertEvent } from 'xstate'
import type { Cell } from './types'
import { ALPHABET_WITH_FILLER, NUM_OF_ROWS } from "./constants"
import { parseInput, withUpdatedCellDependencies, propagateChanges } from "./utils"

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
      const { error, cleanTokens: tokens, value } = parseInput(event.input, context.cells)
      const updatedCell: Cell = {
        content: event.input,
        value,
        tokens,
        cellsThatDependOnMe: context.cells[event.indexOfCell].cellsThatDependOnMe,
      }
      const updatedCells = withUpdatedCellDependencies(context.cells.toSpliced(event.indexOfCell, 1, updatedCell),
        context.cells[event.indexOfCell].tokens,
        event.indexOfCell)

      // TODO: Propagate changes 
      // A function that takes cells and the cell that just changed
      // goes through cell.cellsThatDependOnMe...
      // forEach(cell) recalculate that cell => add to errors; go through cell.CellsThatDependOnMe...
      // and returns {errors, cells}
      updatedCells = propagateChanges(updatedCells, event.indexOfCell)

      if (error !== undefined) {
        console.log(`We've got an error -- keep calm and carry on!\nHere's the error message: ${error}`);
      }

      return {
        cells: updatedCells
      }
    }),
  }
})
  .createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QGEwBs2wHQCcwEMIBPAYgGMALfAOxlQwG0AGAXUVAAcB7WASwBdeXauxAAPRABYATABoQRRAA4AjFgCsAX23zqXCHFH1Mo7n0HDREhAFoAbPMW27OkMex5CTzjwFCRSOKIdgDMWEoAnEqSIQDs6o6IKkrSGrGq0lramkA */
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
