<script setup lang="ts">
import { computed, inject } from "vue"
import { CELLS_MACHINE_KEY } from "./types/types"

const { snapshot } = inject(CELLS_MACHINE_KEY)!
const message = computed(() => {
    if (snapshot.value.matches("submitting")) return "Saving..."
    if (snapshot.value.context.feedback.type === "success") return "OK"
    if (snapshot.value.context.feedback.type === "error")
        return snapshot.value.context.feedback.message
    return "" // idle state
})
</script>

<template>
    <div>
        <p>{{ message }}</p>
    </div>
</template>
