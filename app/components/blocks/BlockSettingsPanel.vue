<template>
  <USlideover v-model="isOpen" side="right">
    <UCard class="h-full">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            Block Settings
          </h3>
          <UButton icon="i-lucide-x" variant="ghost" @click="$emit('close')" />
        </div>
      </template>

      <div class="space-y-4">
        <div class="text-center text-gray-500">
          <UIcon name="i-lucide-settings" class="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Block settings coming soon!</p>
        </div>
      </div>
    </UCard>
  </USlideover>
</template>

<script setup lang="ts">
import type { Block } from '~/shared/types/blocks'

interface Props {
  block?: Block
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [updates: Partial<Block>]
  close: []
}>()

const isOpen = ref(true)
</script>
