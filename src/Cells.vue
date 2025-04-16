<script setup lang="ts">
import { useMachine } from '@xstate/vue'
import { cellsMachine } from './cellsMachine'
import { createBrowserInspector } from '@statelyai/inspect'
import { computed, watch } from 'vue';
import { ALPHABET_WITH_FILLER, NUM_OF_ROWS } from "./constants";
import { handleErrors } from './utils';
import { Cell } from './types'

const { inspect } = createBrowserInspector({
  // Comment out the line below to start the inspector
  autoStart: false
});

const { snapshot, send } = useMachine(cellsMachine, {
  inspect
})
const cells = computed(() => snapshot.value.context.cells)
function onFocus(event: Event, x: number, y: number) {
  const input = event.target as HTMLInputElement
  const cell = cells.value[NUM_OF_ROWS * (x - 1) + y - 1]
  input.value = cell?.content ?? ''
}

function onBlur(event: Event, x: number, y: number) {
  const input = event.target as HTMLInputElement
  const cell = cells.value[NUM_OF_ROWS * (x - 1) + y - 1]
  input.value = typeof cell?.value === 'number'
    ? String(cell.value)
    : cell?.content ?? ''
}
function getDisplayValue(cell: Cell) {
  return cell.value === undefined 
  ? cell.content
  : String(cell.value)
}
watch(() => snapshot.value.context.errors, () => handleErrors(snapshot.value.context.errors))
</script>

<template>
  <main>
    <template v-for="(number, y) in (NUM_OF_ROWS + 1)">
      <template v-for="(letter, x) in ALPHABET_WITH_FILLER">
        <template v-if="number === 1">
          <div class="track-names" v-if="x > 0">{{ letter }}</div>
          <div class="track-names" v-else></div>
        </template>
        <template v-else>
          <template v-if="letter === '-'">
            <div class="track-names">
              {{ number - 2 }}
            </div>
          </template>
          <template v-else>
            <div class="cell">
              <Transition name="update-value">
                <input :key="letter + number"
                  @change.trim="event => send({ type: 'changeCellContent', indexOfCell: (NUM_OF_ROWS * (x - 1) + y - 1), value: (event.target as HTMLInputElement).value })"
                  :value="getDisplayValue(cells[NUM_OF_ROWS * (x - 1) + y - 1])" @focus="(e) => onFocus(e, x, y)"
                  @blur="(e) => onBlur(e, x, y)" @click="() => console.log(cells[NUM_OF_ROWS * (x - 1) + y - 1])">
                </input>
              </Transition>
            </div>
          </template>
        </template>
      </template>
    </template>
  </main>
</template>

<style>
.update-value-enter-active,
.update-value-leave-active {
  transition: opacity 0.2s ease,
    background-color 0.4s ease-out;
}

.update-value-enter-from,
.update-value-leave-to {
  opacity: 0;
  background-color: #f8fbc5;
}
</style>
