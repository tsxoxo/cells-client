<script setup lang="ts">
import { useMachine } from '@xstate/vue'
import { cellsMachine } from './cellsMachine'
import { createBrowserInspector } from '@statelyai/inspect'
import { computed } from 'vue';

const { inspect } = createBrowserInspector({
  // Comment out the line below to start the inspector
  autoStart: false
});

const alphabetWithFiller = ['-', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

const { snapshot, send } = useMachine(cellsMachine, {
  inspect
})
const circles = computed(() => snapshot.value.context.states[snapshot.value.context.stateHistory[snapshot.value.context.currentPosInStateHistory]])

const handleClick = (e: MouseEvent) => {
  send({ type: 'leftClickOnCanvas', coordinates: { x: e.offsetX, y: e.offsetY } })
}

</script>

<template>
  <main>
    <template v-for="number in 101">
      <template v-for="letter in alphabetWithFiller">
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
            <div class="cell"> e</div>
          </template>
        </template>
      </template>
    </template>
  </main>
</template>