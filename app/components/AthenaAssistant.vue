<template>
  <div class="athena-assistant">
    <!-- AI Assistant Container -->
    <div
      ref="athenaContainer"
      class="athena-3d-container"
      :class="{
        'athena-minimized': isMinimized,
        'athena-speaking': isSpeaking,
        'athena-listening': isListening
      }"
    >
      <!-- 3D Canvas -->
      <canvas
        ref="athenaCanvas"
        class="athena-canvas"
        @click="toggleAssistant"
      />

      <!-- Status Indicator -->
      <div v-if="status" class="athena-status">
        <div class="status-dot" :class="statusClass" />
        <span class="status-text">{{ status }}</span>
      </div>
    </div>

    <!-- Chat Interface -->
    <div
      v-if="!isMinimized"
      class="athena-chat-interface"
    >
      <!-- Chat Messages -->
      <div ref="chatMessages" class="chat-messages">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message"
          :class="{
            'message-user': message.role === 'user',
            'message-assistant': message.role === 'assistant'
          }"
        >
          <div class="message-avatar">
            <UIcon
              :name="message.role === 'user' ? 'i-lucide-user' : 'i-lucide-sparkles'"
              class="w-6 h-6"
              :class="message.role === 'user' ? 'text-blue-500' : 'text-purple-500'"
            />
          </div>
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(message.content)" />
            <div class="message-time">
              {{ formatTime(message.timestamp) }}
            </div>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div v-if="isThinking" class="message message-assistant">
          <div class="message-avatar">
            <UIcon name="i-lucide-sparkles" class="w-6 h-6 text-purple-500 animate-pulse" />
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <span /><span /><span />
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="chat-input-area">
        <div class="flex items-end gap-2">
          <div class="flex-1">
            <textarea
              ref="chatInput"
              v-model="currentMessage"
              class="chat-input"
              :placeholder="inputPlaceholder"
              :disabled="isThinking"
              rows="1"
              @keydown.enter.prevent="handleEnterKey"
              @input="handleInputChange"
            />
          </div>

          <div class="flex items-center gap-2">
            <!-- Voice Input Button -->
            <UButton
              :icon="isListening ? 'i-lucide-mic-off' : 'i-lucide-mic'"
              :color="isListening ? 'red' : 'gray'"
              variant="ghost"
              size="sm"
              :disabled="isThinking"
              @click="toggleVoiceInput"
            />

            <!-- Send Button -->
            <UButton
              icon="i-lucide-send"
              :disabled="!currentMessage.trim() || isThinking"
              @click="sendMessage"
            >
              Send
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div v-if="!isMinimized && quickActions.length" class="quick-actions">
      <div class="text-xs text-gray-500 mb-2">
        Quick Actions
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="action in quickActions"
          :key="action.label"
          :label="action.label"
          :icon="action.icon"
          size="xs"
          variant="outline"
          @click="executeAction(action)"
        />
      </div>
    </div>

    <!-- Minimize/Maximize Toggle -->
    <UButton
      :icon="isMinimized ? 'i-lucide-maximize-2' : 'i-lucide-minimize-2'"
      variant="ghost"
      size="xs"
      class="athena-toggle"
      @click="isMinimized = !isMinimized"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import * as THREE from 'three'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface QuickAction {
  label: string
  icon: string
  action: string
}

const emit = defineEmits<{
  message: [message: Message]
  action: [action: string, data?: any]
}>()

// Reactive state
const athenaContainer = ref<HTMLElement>()
const athenaCanvas = ref<HTMLCanvasElement>()
const chatMessages = ref<HTMLElement>()
const chatInput = ref<HTMLTextAreaElement>()

const isMinimized = ref(false)
const isListening = ref(false)
const isSpeaking = ref(false)
const isThinking = ref(false)
const status = ref('Ready')
const currentMessage = ref('')
const messages = ref<Message[]>([
  {
    id: '1',
    role: 'assistant',
    content: 'Hello! I\'m ATHENA, your AI assistant. I can help you with workspace management, content creation, coding, and much more. What would you like to work on today?',
    timestamp: new Date()
  }
])

// 3D Scene variables
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let athenaModel: THREE.Group
let animationId: number

// Computed
const statusClass = computed(() => {
  if (isListening.value) return 'status-listening'
  if (isSpeaking.value) return 'status-speaking'
  if (isThinking.value) return 'status-thinking'
  return 'status-ready'
})

const inputPlaceholder = computed(() => {
  if (isListening.value) return 'Listening...'
  if (isThinking.value) return 'ATHENA is thinking...'
  return 'Ask ATHENA anything...'
})

const quickActions = ref<QuickAction[]>([
  { label: 'Create Document', icon: 'i-lucide-file-plus', action: 'create-document' },
  { label: 'Summarize', icon: 'i-lucide-file-text', action: 'summarize' },
  { label: 'Generate Code', icon: 'i-lucide-code', action: 'generate-code' },
  { label: 'Help', icon: 'i-lucide-help-circle', action: 'help' }
])

// 3D Scene Setup
const initThreeJS = () => {
  if (!athenaCanvas.value) return

  // Scene setup
  scene = new THREE.Scene()
  scene.background = null // Transparent background

  // Camera setup
  camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
  camera.position.z = 5

  // Renderer setup
  renderer = new THREE.WebGLRenderer({
    canvas: athenaCanvas.value,
    alpha: true,
    antialias: true
  })
  renderer.setSize(200, 200)
  renderer.setClearColor(0x000000, 0)

  // Create ATHENA model (simple geometric representation)
  createAthenaModel()

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
  scene.add(ambientLight)

  const pointLight = new THREE.PointLight(0x8B5CF6, 1, 100)
  pointLight.position.set(10, 10, 10)
  scene.add(pointLight)

  // Start animation
  animate()
}

const createAthenaModel = () => {
  athenaModel = new THREE.Group()

  // Core orb (representing ATHENA's consciousness)
  const orbGeometry = new THREE.SphereGeometry(1, 32, 32)
  const orbMaterial = new THREE.MeshPhongMaterial({
    color: 0x8B5CF6,
    transparent: true,
    opacity: 0.8,
    shininess: 100
  })
  const orb = new THREE.Mesh(orbGeometry, orbMaterial)
  athenaModel.add(orb)

  // Floating ring elements
  for (let i = 0; i < 3; i++) {
    const ringGeometry = new THREE.TorusGeometry(1.5 + i * 0.3, 0.05, 8, 32)
    const ringMaterial = new THREE.MeshPhongMaterial({
      color: 0x3B82F6,
      transparent: true,
      opacity: 0.3 - i * 0.05
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = Math.PI / 2 + i * 0.2
    ring.rotation.z = i * 0.3
    athenaModel.add(ring)
  }

  // Particle system for AI thinking effect
  const particlesGeometry = new THREE.BufferGeometry()
  const particlesCount = 50
  const posArray = new Float32Array(particlesCount * 3)

  for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 8
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.02,
    color: 0x8B5CF6,
    transparent: true,
    opacity: 0.5
  })

  const particles = new THREE.Points(particlesGeometry, particlesMaterial)
  athenaModel.add(particles)

  scene.add(athenaModel)
}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  if (athenaModel) {
    // Base rotation
    athenaModel.rotation.y += 0.01

    // Pulsing effect when speaking/thinking
    const pulse = isSpeaking.value || isThinking.value
      ? Math.sin(Date.now() * 0.005) * 0.1 + 1
      : 1
    athenaModel.scale.set(pulse, pulse, pulse)

    // Ring rotation
    athenaModel.children.forEach((child, index) => {
      if (child.type === 'Mesh' && index > 0 && index < 4) {
        child.rotation.z += (index % 2 ? 0.02 : -0.02)
      }
    })
  }

  renderer.render(scene, camera)
}

// Message handling
const sendMessage = async () => {
  if (!currentMessage.value.trim() || isThinking.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: currentMessage.value,
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  emit('message', userMessage)

  const messageContent = currentMessage.value
  currentMessage.value = ''
  isThinking.value = true
  status.value = 'Thinking...'

  // Scroll to bottom
  await nextTick()
  scrollToBottom()

  // Simulate AI response (replace with actual AI integration)
  setTimeout(() => {
    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: generateAIResponse(messageContent),
      timestamp: new Date()
    }

    messages.value.push(assistantMessage)
    emit('message', assistantMessage)

    isThinking.value = false
    isSpeaking.value = true
    status.value = 'Speaking...'

    // Stop speaking after a delay
    setTimeout(() => {
      isSpeaking.value = false
      status.value = 'Ready'
    }, 2000)

    scrollToBottom()
  }, 1500)
}

const generateAIResponse = (input: string): string => {
  // Simple response generation for demo - replace with actual AI
  const responses = [
    `I understand you want to "${input}". Let me help you with that.`,
    `That's an interesting question about "${input}". Here's what I think...`,
    `I can help you with "${input}". Let me break this down for you.`,
    `Great idea about "${input}"! Here are some suggestions...`
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}

const handleEnterKey = (event: KeyboardEvent) => {
  if (!event.shiftKey) {
    sendMessage()
  }
}

const handleInputChange = () => {
  // Auto-resize textarea
  if (chatInput.value) {
    chatInput.value.style.height = 'auto'
    chatInput.value.style.height = chatInput.value.scrollHeight + 'px'
  }
}

const toggleVoiceInput = () => {
  isListening.value = !isListening.value
  status.value = isListening.value ? 'Listening...' : 'Ready'

  if (isListening.value) {
    // Start speech recognition (placeholder)
    console.log('Starting voice recognition...')
  } else {
    // Stop speech recognition
    console.log('Stopping voice recognition...')
  }
}

const toggleAssistant = () => {
  isMinimized.value = !isMinimized.value
}

const executeAction = (action: QuickAction) => {
  emit('action', action.action)

  // Add system message
  const systemMessage: Message = {
    id: Date.now().toString(),
    role: 'assistant',
    content: `Executing: ${action.label}`,
    timestamp: new Date()
  }

  messages.value.push(systemMessage)
  scrollToBottom()
}

const formatMessage = (content: string): string => {
  // Simple markdown-like formatting
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>')
}

const formatTime = (timestamp: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(timestamp)
}

const scrollToBottom = () => {
  if (chatMessages.value) {
    chatMessages.value.scrollTop = chatMessages.value.scrollHeight
  }
}

// Lifecycle
onMounted(() => {
  initThreeJS()

  // Focus input
  if (chatInput.value) {
    chatInput.value.focus()
  }
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (renderer) {
    renderer.dispose()
  }
})

// Watch for container resize
watch(isMinimized, () => {
  if (renderer && !isMinimized.value) {
    nextTick(() => {
      renderer.setSize(200, 200)
      camera.aspect = 1
      camera.updateProjectionMatrix()
    })
  }
})
</script>

<style scoped>
.athena-assistant {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 50;
  max-width: 24rem;
  width: 20rem;
}

.athena-3d-container {
  position: relative;
  background-color: white;
  border-radius: 0.5rem 0.5rem 0 0;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid #e5e7eb;
  transition: all 300ms;
}

.dark .athena-3d-container {
  background-color: #111827;
  border-color: #374151;
}

.athena-3d-container.athena-minimized {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
}

.athena-3d-container.athena-speaking {
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.5);
}

.athena-3d-container.athena-listening {
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
}

.athena-canvas {
  display: block;
  margin-left: auto;
  margin-right: auto;
  cursor: pointer;
}

.athena-minimized .athena-canvas {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
}

.athena-status {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}

.status-ready {
  background-color: #10b981;
}

.status-listening {
  background-color: #3b82f6;
  animation: pulse 2s infinite;
}

.status-speaking {
  background-color: #8b5cf6;
  animation: pulse 2s infinite;
}

.status-thinking {
  background-color: #eab308;
  animation: pulse 2s infinite;
}

.athena-chat-interface {
  background-color: white;
  border-top: 1px solid #e5e7eb;
  max-height: 24rem;
}

.dark .athena-chat-interface {
  background-color: #111827;
  border-color: #374151;
}

.chat-messages {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 16rem;
  overflow-y: auto;
}

.message {
  display: flex;
  gap: 0.75rem;
}

.message-user {
  justify-content: flex-end;
}

.message-user .message-content {
  background-color: #3b82f6;
  color: white;
}

.message-assistant .message-content {
  background-color: #f3f4f6;
  color: #111827;
}

.dark .message-assistant .message-content {
  background-color: #1f2937;
  color: white;
}

.message-avatar {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dark .message-avatar {
  background-color: #1f2937;
}

.message-content {
  max-width: 18rem;
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.message-text {
  font-size: 0.875rem;
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.6;
  margin-top: 0.25rem;
}

.typing-indicator {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  padding: 0.25rem 0;
}

.typing-indicator span {
  width: 0.5rem;
  height: 0.5rem;
  background-color: #9ca3af;
  border-radius: 50%;
  animation: bounce 1s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.3s;
}

.chat-input-area {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.dark .chat-input-area {
  border-color: #374151;
}

.chat-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: white;
  color: #111827;
  resize: none;
  outline: none;
  max-height: 100px;
}

.dark .chat-input {
  border-color: #4b5563;
  background-color: #1f2937;
  color: white;
}

.chat-input:focus {
  outline: 2px solid #8b5cf6;
  outline-offset: 2px;
}

.chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-actions {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
  border-radius: 0 0 0.5rem 0.5rem;
}

.dark .quick-actions {
  border-color: #374151;
  background-color: #1f2937;
}

.athena-toggle {
  position: absolute;
  top: -0.75rem;
  left: -0.75rem;
  background-color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.dark .athena-toggle {
  background-color: #1f2937;
}

/* Hide scrollbar but keep functionality */
.chat-messages {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 transparent;
}

.chat-messages::-webkit-scrollbar {
  width: 0.5rem;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 9999px;
}

.dark .chat-messages::-webkit-scrollbar-thumb {
  background-color: #4b5563;
}

/* Add missing animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-0.25rem);
  }
}
</style>
