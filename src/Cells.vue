<script setup lang="ts">
import { useMachine } from '@xstate/vue'
import { cellsMachine } from './cellsMachine'
import { createBrowserInspector } from '@statelyai/inspect'
import { computed } from 'vue';

const { inspect } = createBrowserInspector({
  // Comment out the line below to start the inspector
  autoStart: false
});

const uppercaseAlphabet = Array.from({ length: 26 }, (_element, index) => String.fromCharCode(65 + index));

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
    hello
  </main>
</template>