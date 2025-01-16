<script setup lang="ts">
import { useMachine } from '@xstate/vue'
import { circlesMachine } from './circlesMachine'
import { createBrowserInspector } from '@statelyai/inspect'
import { computed } from 'vue';


const { inspect } = createBrowserInspector({
  // Comment out the line below to start the inspector
  autoStart: false
});

const { snapshot, send } = useMachine(circlesMachine, {
  inspect
})
const circles = computed(() => snapshot.value.context.states[snapshot.value.context.stateHistory[snapshot.value.context.currentPosInStateHistory]])

// const lastClickCoordinates = ref({x: 0, y: 0})
const handleClick = (e: MouseEvent) => {
  // lastClickCoordinates.value = {x: e.offsetX, y: e.offsetY}
  send({ type: 'leftClickOnCanvas', coordinates: { x: e.offsetX, y: e.offsetY } })
}
// watch(() => snapshot.value, (snapshot) => console.log(snapshot.value)
// )
</script>

<template>
  <main>
    <div id="canvas" @click="handleClick">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <circle v-for="(circle, index) in circles" :cx="circle.coordinates.x" :cy="circle.coordinates.y"
          :r="circle.radius" class="circle"
          :class="[index === snapshot.context.indexOfSelectedCircle ? 'selected' : '']" :key="circle.id" />

      </svg>
    </div>

    <div id="menu">
      <div id="slider-div">
        <input @input="(e: Event) => {
          const target = e.target as HTMLInputElement
          send({ type: 'changeRadius', newRadius: Number(target.value) })
        }" type="range" id="radius-slider" name="radius-slider" min="1" max="400"
          :value="circles[snapshot.context.indexOfSelectedCircle]?.radius" step="1"
          :disabled="snapshot.context.indexOfSelectedCircle === -1" />
      </div>
      <div id="buttons">
        <template v-if="snapshot.value === 'ready'">
          <button @click="send({ type: 'undo', })" :disabled="snapshot.context.currentPosInStateHistory === 0">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3 9H16C17.3261 9 18.5979 9.52678 19.5355 10.4645C20.4732 11.4021 21 12.6739 21 14C21 15.3261 20.4732 16.5979 19.5355 17.5355C18.5979 18.4732 17.3261 19 16 19H7M3 9L7 5M3 9L7 13" />
            </svg>
            Undo
          </button>
          <button @click="send({ type: 'redo', })"
            :disabled="snapshot.context.stateHistory[snapshot.context.currentPosInStateHistory] === snapshot.context.states.length - 1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M21 9H8C6.67392 9 5.40215 9.52678 4.46447 10.4645C3.52678 11.4021 3 12.6739 3 14C3 15.3261 3.52678 16.5979 4.46447 17.5355C5.40215 18.4732 6.67392 19 8 19H17M21 9L17 5M21 9L17 13" />
            </svg>

            Redo
          </button>
        </template>
        <template v-else-if="snapshot.value === 'changingCircle'">
          <button @click="send({ type: 'cancel', })"><svg style='width:22px; height:22px' viewBox="0 0 16 16"
              fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="3.33351" y1="2.85985" x2="12.6673" y2="12.1937" stroke-width="1.33" />
              <line y1="-0.665" x2="13.2" y2="-0.665"
                transform="matrix(-0.707107 0.707107 0.707107 0.707107 13.1367 3.33789)" stroke-width="1.33" />
            </svg>

            Cancel</button>
          <button @click="send({ type: 'confirm', })"><svg style='width:24px; height:24px' viewBox="0 0 24 24"
              fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 11L11 17L21 7" />
            </svg>
            Confirm</button>
        </template>
      </div>
    </div>
  </main>
</template>