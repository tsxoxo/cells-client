<script setup lang="ts">
import { useMachine } from '@xstate/vue'
import { cellsMachine } from './cellsMachine'
import { createBrowserInspector } from '@statelyai/inspect'
import { computed, watch } from 'vue';
import { ALPHABET_WITH_FILLER, NUM_OF_ROWS } from "./constants";

const { inspect } = createBrowserInspector({
  // Comment out the line below to start the inspector
  autoStart: false
});

const { snapshot, send } = useMachine(cellsMachine, {
  inspect
})
const cells = computed(() => snapshot.value.context.cells)
watch(cells, () => console.log(cells.value))
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
            <div class="cell"><input
                @change="event => send({ type: 'changeCell', cellID: (NUM_OF_ROWS * (x - 1) + y - 1), newValue: Number((event.target as HTMLInputElement).value) })"
                :value="cells[NUM_OF_ROWS * (x - 1) + y - 1]?.value"></input>
            </div>
          </template>
        </template>
      </template>
    </template>
  </main>
</template>