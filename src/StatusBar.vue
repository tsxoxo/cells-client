<script setup lang="ts">
import { computed, inject } from "vue"
import { CELLS_MACHINE_KEY } from "./types/types"
import { UI } from "./config/ui-strings.ts"

const { snapshot } = inject(CELLS_MACHINE_KEY)!
const message = computed(() => {
    if (snapshot.value.matches("submitting")) return UI.bar.submitting
    if (snapshot.value.context.feedback.type === "success")
        return UI.bar.submitted_ok
    if (snapshot.value.context.feedback.type === "error")
        return snapshot.value.context.feedback.message
    return "" // idle state
})
</script>

<template>
    <div data-testid="status-bar">
        <p>{{ message }}</p>
    </div>
</template>
