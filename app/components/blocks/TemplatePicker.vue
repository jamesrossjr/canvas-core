<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Choose Template</h3>
          <UButton icon="i-lucide-x" variant="ghost" @click="isOpen = false" />
        </div>
      </template>
      
      <div class="space-y-4">
        <div class="text-center text-gray-500">
          <UIcon name="i-lucide-layout-template" class="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Template system coming soon!</p>
        </div>
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'select': [template: any]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>