<template>
  <div class="code-block">
    <div class="bg-gray-900 rounded-lg p-4">
      <pre class="text-green-400 text-sm font-mono"><code>{{ block.content.code || '// Code block coming soon...' }}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CodeBlock } from '~/shared/types/blocks'

interface Props {
  block: CodeBlock
  focused: boolean
  viewMode: 'edit' | 'preview'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update': [updates: Partial<CodeBlock>]
  'focus': []
  'blur': []
}>()
</script>