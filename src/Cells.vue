<script setup lang="ts">
import { useMachine } from '@xstate/vue'
import { cellsMachine } from './cellsMachine'
import { createBrowserInspector } from '@statelyai/inspect'
import { computed } from 'vue';

const { inspect } = createBrowserInspector({
  // Comment out the line below to start the inspector
  autoStart: false
});

const ALPHABET_WITH_FILLER = ['-', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
const NUM_OF_ROWS = 100

const { snapshot, send } = useMachine(cellsMachine, {
  inspect
})
const cells = computed(() => snapshot.value.context.cells)

// const handleClick = (e: MouseEvent) => {
//   send({ type: 'leftClickOnCanvas', coordinates: { x: e.offsetX, y: e.offsetY } })
// }

</script>

<template>
  <main>
    <template v-for="(number, y) in (NUM_OF_ROWS + 1)">
      <template v-for="(letter, x) in ALPHABET_WITH_FILLER">
        <template v-if="number === 1">
          <div class="track-names">{{ letter }}</div>
        </template>
        <template v-else>
          <template v-if="letter === '-'">
            <div class="track-names">
              {{ number - 2 }}
            </div>
          </template>
          <template v-else>
            <div class="cell"><input type="number" :value="cells[NUM_OF_ROWS * (x - 1) + y - 1]?.content"></input>
            </div>
          </template>
        </template>
      </template>
    </template>
  </main>
</template>