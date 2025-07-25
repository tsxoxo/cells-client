<script setup lang="ts">
import { inject } from "vue"
import { CELLS_MACHINE_KEY } from "./types/types"

const { snapshot } = inject(CELLS_MACHINE_KEY)!
// START_HERE: 07-25
// * derive status bar message from both machine.state ('Saving...') and
// machine.context (Saved)
// * Clear context.feedback after delay in cellsMachine in submitting.onDone
</script>

<template>
    <div>
        <p>{{ snapshot.context.feedback.message }}</p>
    </div>
</template>
