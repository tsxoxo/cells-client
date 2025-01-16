import { setup, assign, assertEvent } from 'xstate'
import type { Circle, State } from './types'

const DEFAULT_RADIUS = 100;
// const INITIAL_CIRCLES: Circle[] = [
//   {
//     coordinates: { x: 100, y: 100 },
//     radius: DEFAULT_RADIUS,
//     id: 0
//   },
//   {
//     coordinates: { x: 200, y: 400 },
//     radius: DEFAULT_RADIUS / 2,
//     id: 0
//   },
//   {
//     coordinates: { x: 200, y: 200 },
//     radius: DEFAULT_RADIUS / 6,
//     id: 0
//   }
// ];

const INITIAL_CIRCLES = [] as Circle[]

function findClosestCircleThatIntersects(circles: Circle[], coordinates: { x: number, y: number }) {

  let bestCandidateSoFar = { index: -1, distance: 999999 };

  for (let index = 0; index < circles.length; index++) {
    const circle = circles[index];
    const r = circle.radius
    const deltaX = Math.abs(circle.coordinates.x - coordinates.x);
    const deltaY = Math.abs(circle.coordinates.y - coordinates.y);

    if (deltaX <= r && deltaY <= r) {
      const distance = Math.hypot(deltaX, deltaY)

      if (distance <= r && distance <= bestCandidateSoFar.distance) {
        bestCandidateSoFar = {
          index,
          distance
        }
      }
    }
  }

  return bestCandidateSoFar.index;
}

interface Context { 'states': State[], 'stateHistory': number[], 'indexOfSelectedCircle': number, 'currentPosInStateHistory': number }

export const circlesMachine = setup({
  "types": {
    "context": {} as Context,
    "events": {} as { type: 'undo', } | { type: 'redo', } | { type: 'leftClickOnCanvas', coordinates: { x: number, y: number } } | { type: 'changeCircle', } | { type: 'confirm', } | { type: 'cancel', } | { type: 'changeRadius', newRadius: number }
  },
  "guards": {
    "checkIfThereIsSelected": ({ context }) =>
      context.indexOfSelectedCircle > -1
  },
  "actions": {
    "deselectCircle": assign(() => {
      return {
        indexOfSelectedCircle: -1
      }
    }),
    "selectOrCreateCircle": assign(({ context, event }) => {
      assertEvent(event, 'leftClickOnCanvas');

      const changesToContext: Partial<typeof context> = {}
      const currentStateCopy: State = context.states[context.stateHistory[context.currentPosInStateHistory]].slice()
      const indexOfCircleToSelect: number = findClosestCircleThatIntersects(currentStateCopy, event.coordinates)

      changesToContext.indexOfSelectedCircle = indexOfCircleToSelect

      if (indexOfCircleToSelect === -1) {
        const newCircle = {
          coordinates: event.coordinates,
          radius: DEFAULT_RADIUS,
          id: currentStateCopy.length - 1
        }
        const newState = [...currentStateCopy, newCircle]

        changesToContext.states = [...context.states, newState]
        changesToContext.stateHistory = [...context.stateHistory, changesToContext.states.length - 1]
        changesToContext.currentPosInStateHistory = changesToContext.stateHistory.length - 1
      }

      return { ...changesToContext }
    }
    ),
    "createTempState": assign(({ context }) => {
      const changesToContext: Partial<typeof context> = {}
      const currentStateCopy: State = context.states[context.stateHistory[context.currentPosInStateHistory]].slice()

      changesToContext.states = [...context.states, currentStateCopy]
      changesToContext.stateHistory = [...context.stateHistory, changesToContext.states.length - 1]
      changesToContext.currentPosInStateHistory = changesToContext.stateHistory.length - 1

      return { ...changesToContext }
    }
    ),
    "undo": assign(({ context, event }) => {
      assertEvent(event, 'undo');

      const changesToContext: Partial<typeof context> = {}

      if (context.currentPosInStateHistory > 0) {
        changesToContext.currentPosInStateHistory = context.currentPosInStateHistory - 1
        changesToContext.stateHistory = [...context.stateHistory, context.stateHistory[changesToContext.currentPosInStateHistory!]]
      }

      return changesToContext
    }
    ),
    "redo": assign(({ context, event }) => {
      assertEvent(event, 'redo');

      const changesToContext: Partial<typeof context> = {}

      if (context.currentPosInStateHistory < context.stateHistory.length - 1) {
        changesToContext.currentPosInStateHistory = context.currentPosInStateHistory + 1
        changesToContext.stateHistory = [...context.stateHistory, context.stateHistory[changesToContext.currentPosInStateHistory!]]
      }

      return changesToContext
    }
    ),
    "removeTempState": assign(({ context }) => {
      const changesToContext: Partial<typeof context> = {}

      const statesWithoutTempState: State[] = context.states.toSpliced(-1, 1)
      const stateHistoryWithoutTempStateIndex = context.stateHistory.toSpliced(-1, 1)

      changesToContext.states = statesWithoutTempState
      changesToContext.stateHistory = stateHistoryWithoutTempStateIndex
      changesToContext.currentPosInStateHistory = changesToContext.stateHistory.length - 1

      return { ...changesToContext }
    }),
    "changeRadius": assign(({ context, event }) => {
      assertEvent(event, 'changeRadius');

      const changesToContext: Partial<typeof context> = {}
      const currentStateCopy: State = structuredClone(context.states[context.stateHistory[context.currentPosInStateHistory]])

      currentStateCopy[context.indexOfSelectedCircle].radius = event.newRadius
      changesToContext.states = context.states.toSpliced(context.stateHistory[context.currentPosInStateHistory], 1, currentStateCopy)

      return { ...changesToContext }
    }
    )
  }
})
  .createMachine({
    "context": {
      "states": [INITIAL_CIRCLES],
      "stateHistory": [
        0
      ],
      "currentPosInStateHistory": 0,
      'indexOfSelectedCircle': -1,
    },
    "id": "Circles",
    "initial": "ready",
    "states": {
      "ready": {
        always: {
          guard: { type: 'checkIfThereIsSelected' },
          "target": "changingCircle",
        },
        "on": {
          "leftClickOnCanvas": {
            "target": "ready",
            "actions": {
              "type": "selectOrCreateCircle"
            }
          },
          "undo": {
            "target": "ready",
            "actions": {
              "type": "undo"
            }
          },
          "redo": {
            "target": "ready",
            "actions": {
              "type": "redo"
            }
          }
        }
      },
      "changingCircle": {
        entry: [{
          "type": "createTempState"
        }],
        "on":
        {
          "leftClickOnCanvas": {
            "target": "ready",
            "actions": {
              "type": "selectOrCreateCircle"
            }
          },
          "confirm": {
            "target": "ready",
            'actions': {
              "type": "deselectCircle"
            }
          },
          "cancel": {
            "target": "ready",
            "actions": [
              {
                "type": "removeTempState"
              },
              {
                "type": "deselectCircle"
              }
            ]
          },
          "changeRadius": {
            "target": "changingCircle",
            "actions": {
              "type": "changeRadius"
            },
          }
        }
      }
    }
  })
