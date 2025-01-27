import { setup, assign, assertEvent } from 'xstate'
import type { Cell } from './types'

const INITIAL_CELLS = [] as Cell[]
INITIAL_CELLS[0] = {
  content: 10,
  id: 0,
  cellsThatDependOnMe: []
}
INITIAL_CELLS[1] = {
  content: 11,
  id: 1,
  cellsThatDependOnMe: []
}
INITIAL_CELLS[100] = {
  content: 101,
  id: 100,
  cellsThatDependOnMe: []
}

interface Context { 'cells': Cell[] }

export const cellsMachine = setup({
  "types": {
    "context": {} as Context,
    "events": {} as {
      type: 'changeCell', cellID: number
    }
  },
  "actions": {
    "updateCell": assign(() => {
      return {
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
