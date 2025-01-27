import { setup, assign, assertEvent } from 'xstate'
import type { Cell } from './types'
import { ALPHABET_WITH_FILLER, NUM_OF_ROWS } from "./constants";

const INITIAL_CELLS = Array((ALPHABET_WITH_FILLER.length - 1) * NUM_OF_ROWS) as Cell[]
INITIAL_CELLS[0] = {
  content: 10,
  cellsThatDependOnMe: []
}
INITIAL_CELLS[1] = {
  content: 11,
  cellsThatDependOnMe: []
}
INITIAL_CELLS[100] = {
  content: 101,
  cellsThatDependOnMe: []
}

interface Context { 'cells': Cell[] }

export const cellsMachine = setup({
  "types": {
    "context": {} as Context,
    "events": {} as {
      type: 'changeCell', cellID: number, newValue: number
    }
  },
  "actions": {
    "updateCell": assign(({ context, event }) => {
      assertEvent(event, 'changeCell');
      const newCell = structuredClone(context.cells[event.cellID]) ?? {}
      newCell.content = event.newValue
      return {
        cells: context.cells.toSpliced(event.cellID, 1, newCell)
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
