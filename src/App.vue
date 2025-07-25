<script setup lang="ts">
import { provide } from "vue"
import Cells from "./CellsCanvas.vue"
import StatusBar from "./StatusBar.vue"
import { createBrowserInspector } from "@statelyai/inspect"
import { useMachine } from "@xstate/vue"
import { cellsMachine } from "./state/cellsMachine"
import { CELLS_MACHINE_KEY } from "./types/types"

const { inspect } = createBrowserInspector({
    // Comment out the line below to start the inspector
    autoStart: false,
})
const cellsMachineService = useMachine(cellsMachine, { inspect })

provide(CELLS_MACHINE_KEY, cellsMachineService)
</script>

<template>
    <Cells />
    <StatusBar />
</template>
