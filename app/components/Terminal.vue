<script setup lang="ts">
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'

const props = defineProps<{
  workspaceId?: string
  theme?: 'light' | 'dark'
}>()

const emit = defineEmits<{
  command: [command: string]
  output: [output: string]
}>()

const terminalRef = ref<HTMLElement>()
const terminal = ref<Terminal>()
const fitAddon = ref<FitAddon>()
const isConnected = ref(false)
const currentPath = ref('~/workspace')

const mockFileSystem = {
  '~/workspace': ['src', 'public', 'package.json', 'README.md', 'node_modules'],
  '~/workspace/src': ['components', 'pages', 'main.ts'],
  '~/workspace/src/components': ['Header.vue', 'Sidebar.vue'],
  '~/workspace/src/pages': ['index.vue', 'about.vue'],
  '~/workspace/public': ['favicon.ico', 'logo.png'],
  '~/workspace/node_modules': ['.bin', 'vue', 'typescript', 'nuxt']
}

const commandHistory = ref<string[]>([])
let historyIndex = -1
let currentLine = ''

const initializeTerminal = () => {
  if (!terminalRef.value) return

  terminal.value = new Terminal({
    theme: {
      background: props.theme === 'dark' ? '#1f2937' : '#ffffff',
      foreground: props.theme === 'dark' ? '#f9fafb' : '#374151',
      cursor: '#3b82f6',
      selection: props.theme === 'dark' ? '#374151' : '#e5e7eb',
      black: '#000000',
      red: '#ef4444',
      green: '#22c55e',
      yellow: '#eab308',
      blue: '#3b82f6',
      magenta: '#a855f7',
      cyan: '#06b6d4',
      white: '#ffffff',
      brightBlack: '#6b7280',
      brightRed: '#f87171',
      brightGreen: '#4ade80',
      brightYellow: '#facc15',
      brightBlue: '#60a5fa',
      brightMagenta: '#c084fc',
      brightCyan: '#22d3ee',
      brightWhite: '#f9fafb'
    },
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    fontSize: 13,
    lineHeight: 1.4,
    cursorBlink: true,
    cursorStyle: 'block',
    allowTransparency: true,
    convertEol: true,
    disableStdin: false,
    fastScrollModifier: 'alt',
    scrollback: 1000,
    tabStopWidth: 4
  })

  fitAddon.value = new FitAddon()
  terminal.value.loadAddon(fitAddon.value)
  terminal.value.loadAddon(new WebLinksAddon())

  terminal.value.open(terminalRef.value)
  fitAddon.value.fit()

  // Welcome message
  terminal.value.writeln('\x1b[1;36m╭─────────────────────────────────────────────────────────────╮\x1b[0m')
  terminal.value.writeln('\x1b[1;36m│                    Canvas Terminal v1.0                    │\x1b[0m')
  terminal.value.writeln('\x1b[1;36m│                                                             │\x1b[0m')
  terminal.value.writeln('\x1b[1;36m│  Welcome to your Canvas workspace terminal!                │\x1b[0m')
  terminal.value.writeln('\x1b[1;36m│  Type "help" for available commands                        │\x1b[0m')
  terminal.value.writeln('\x1b[1;36m╰─────────────────────────────────────────────────────────────╯\x1b[0m')
  terminal.value.writeln('')

  writePrompt()

  // Handle terminal input
  terminal.value.onData((data) => {
    const code = data.charCodeAt(0)
    
    if (code === 13) { // Enter
      terminal.value.writeln('')
      processCommand(currentLine.trim())
      currentLine = ''
      historyIndex = -1
    } else if (code === 127) { // Backspace
      if (currentLine.length > 0) {
        currentLine = currentLine.slice(0, -1)
        terminal.value.write('\b \b')
      }
    } else if (code === 27) { // Escape sequences (arrow keys)
      const sequence = data.slice(1)
      if (sequence === '[A') { // Up arrow
        navigateHistory(-1)
      } else if (sequence === '[B') { // Down arrow
        navigateHistory(1)
      } else if (sequence === '[C') { // Right arrow
        // Handle right arrow if needed
      } else if (sequence === '[D') { // Left arrow
        // Handle left arrow if needed
      }
    } else if (code >= 32 && code <= 126) { // Printable characters
      currentLine += data
      terminal.value.write(data)
    }
  })

  isConnected.value = true
}

const writePrompt = () => {
  const prompt = `\x1b[1;32mcanvas\x1b[0m:\x1b[1;34m${currentPath.value}\x1b[0m$ `
  terminal.value?.write(prompt)
}

const navigateHistory = (direction: number) => {
  if (commandHistory.value.length === 0) return
  
  if (historyIndex === -1 && direction === -1) {
    historyIndex = commandHistory.value.length - 1
  } else {
    historyIndex = Math.max(0, Math.min(commandHistory.value.length - 1, historyIndex + direction))
  }
  
  if (historyIndex >= 0 && historyIndex < commandHistory.value.length) {
    // Clear current line
    terminal.value?.write('\r\x1b[K')
    writePrompt()
    
    currentLine = commandHistory.value[historyIndex]
    terminal.value?.write(currentLine)
  }
}

const processCommand = (command: string) => {
  if (command) {
    commandHistory.value.push(command)
    emit('command', command)
  }
  
  const args = command.split(' ')
  const cmd = args[0].toLowerCase()
  
  switch (cmd) {
    case '':
      break
    case 'help':
      showHelp()
      break
    case 'clear':
      terminal.value?.clear()
      break
    case 'ls':
      listFiles(args[1])
      break
    case 'cd':
      changeDirectory(args[1])
      break
    case 'pwd':
      terminal.value?.writeln(currentPath.value)
      break
    case 'echo':
      terminal.value?.writeln(args.slice(1).join(' '))
      break
    case 'cat':
      showFileContent(args[1])
      break
    case 'mkdir':
      makeDirectory(args[1])
      break
    case 'touch':
      createFile(args[1])
      break
    case 'rm':
      removeFile(args[1])
      break
    case 'npm':
    case 'pnpm':
    case 'yarn':
      runPackageManager(cmd, args.slice(1))
      break
    case 'git':
      runGitCommand(args.slice(1))
      break
    case 'node':
      runNodeCommand(args.slice(1))
      break
    default:
      terminal.value?.writeln(`\x1b[1;31mCommand not found: ${cmd}\x1b[0m`)
      terminal.value?.writeln(`Type 'help' for available commands`)
      break
  }
  
  writePrompt()
}

const showHelp = () => {
  const commands = [
    { cmd: 'help', desc: 'Show this help message' },
    { cmd: 'clear', desc: 'Clear the terminal' },
    { cmd: 'ls [path]', desc: 'List directory contents' },
    { cmd: 'cd <path>', desc: 'Change directory' },
    { cmd: 'pwd', desc: 'Print working directory' },
    { cmd: 'cat <file>', desc: 'Display file contents' },
    { cmd: 'mkdir <dir>', desc: 'Create directory' },
    { cmd: 'touch <file>', desc: 'Create empty file' },
    { cmd: 'rm <file>', desc: 'Remove file' },
    { cmd: 'echo <text>', desc: 'Display text' },
    { cmd: 'npm/pnpm/yarn', desc: 'Package manager commands' },
    { cmd: 'git <args>', desc: 'Git version control' },
    { cmd: 'node <file>', desc: 'Run Node.js script' }
  ]
  
  terminal.value?.writeln('\x1b[1;33mAvailable Commands:\x1b[0m')
  commands.forEach(({ cmd, desc }) => {
    terminal.value?.writeln(`  \x1b[1;36m${cmd.padEnd(15)}\x1b[0m ${desc}`)
  })
}

const listFiles = (path?: string) => {
  const targetPath = path ? resolvePath(path) : currentPath.value
  const files = mockFileSystem[targetPath as keyof typeof mockFileSystem] || []
  
  if (files.length === 0) {
    terminal.value?.writeln(`\x1b[1;31mDirectory not found: ${targetPath}\x1b[0m`)
    return
  }
  
  files.forEach(file => {
    const isDir = mockFileSystem[`${targetPath}/${file}` as keyof typeof mockFileSystem]
    const color = isDir ? '\x1b[1;34m' : '\x1b[0m'
    const icon = isDir ? '📁' : '📄'
    terminal.value?.writeln(`${color}${icon} ${file}\x1b[0m`)
  })
}

const changeDirectory = (path?: string) => {
  if (!path) {
    currentPath.value = '~/workspace'
    return
  }
  
  const targetPath = resolvePath(path)
  if (mockFileSystem[targetPath as keyof typeof mockFileSystem]) {
    currentPath.value = targetPath
  } else {
    terminal.value?.writeln(`\x1b[1;31mDirectory not found: ${path}\x1b[0m`)
  }
}

const resolvePath = (path: string): string => {
  if (path.startsWith('~/')) return path
  if (path.startsWith('/')) return `~${path}`
  if (path === '..') {
    const parts = currentPath.value.split('/')
    return parts.slice(0, -1).join('/') || '~/workspace'
  }
  return `${currentPath.value}/${path}`
}

const showFileContent = (filename?: string) => {
  if (!filename) {
    terminal.value?.writeln(`\x1b[1;31mUsage: cat <filename>\x1b[0m`)
    return
  }
  
  const mockContent = {
    'package.json': '{\n  "name": "canvas-workspace",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "nuxt dev"\n  }\n}',
    'README.md': '# Canvas Workspace\n\nAI-powered digital workspace\n\n## Getting Started\n\n```bash\npnpm dev\n```',
    'main.ts': 'import { createApp } from \'vue\'\nimport App from \'./App.vue\'\n\nconst app = createApp(App)\napp.mount(\'#app\')'
  }
  
  const content = mockContent[filename as keyof typeof mockContent]
  if (content) {
    terminal.value?.writeln(content)
  } else {
    terminal.value?.writeln(`\x1b[1;31mFile not found: ${filename}\x1b[0m`)
  }
}

const makeDirectory = (dirname?: string) => {
  if (!dirname) {
    terminal.value?.writeln(`\x1b[1;31mUsage: mkdir <directory>\x1b[0m`)
    return
  }
  terminal.value?.writeln(`\x1b[1;32mCreated directory: ${dirname}\x1b[0m`)
}

const createFile = (filename?: string) => {
  if (!filename) {
    terminal.value?.writeln(`\x1b[1;31mUsage: touch <filename>\x1b[0m`)
    return
  }
  terminal.value?.writeln(`\x1b[1;32mCreated file: ${filename}\x1b[0m`)
}

const removeFile = (filename?: string) => {
  if (!filename) {
    terminal.value?.writeln(`\x1b[1;31mUsage: rm <filename>\x1b[0m`)
    return
  }
  terminal.value?.writeln(`\x1b[1;33mRemoved: ${filename}\x1b[0m`)
}

const runPackageManager = (manager: string, args: string[]) => {
  const command = `${manager} ${args.join(' ')}`
  terminal.value?.writeln(`\x1b[1;36mRunning: ${command}\x1b[0m`)
  
  setTimeout(() => {
    if (args[0] === 'install' || args[0] === 'i') {
      terminal.value?.writeln(`\x1b[1;32m✓ Dependencies installed successfully\x1b[0m`)
    } else if (args[0] === 'dev') {
      terminal.value?.writeln(`\x1b[1;32m✓ Development server started on http://localhost:3000\x1b[0m`)
    } else if (args[0] === 'build') {
      terminal.value?.writeln(`\x1b[1;32m✓ Build completed successfully\x1b[0m`)
    } else {
      terminal.value?.writeln(`\x1b[1;32m✓ Command completed\x1b[0m`)
    }
    writePrompt()
  }, 1000)
}

const runGitCommand = (args: string[]) => {
  const command = `git ${args.join(' ')}`
  terminal.value?.writeln(`\x1b[1;36mRunning: ${command}\x1b[0m`)
  
  setTimeout(() => {
    if (args[0] === 'status') {
      terminal.value?.writeln(`On branch main`)
      terminal.value?.writeln(`Your branch is up to date with 'origin/main'.`)
      terminal.value?.writeln(`nothing to commit, working tree clean`)
    } else if (args[0] === 'log') {
      terminal.value?.writeln(`commit abc123 (HEAD -> main)`)
      terminal.value?.writeln(`Author: Canvas User <user@canvas.com>`)
      terminal.value?.writeln(`Date: ${new Date().toISOString()}`)
      terminal.value?.writeln(`    feat: Add terminal integration`)
    } else {
      terminal.value?.writeln(`\x1b[1;32m✓ Git command completed\x1b[0m`)
    }
    writePrompt()
  }, 500)
}

const runNodeCommand = (args: string[]) => {
  const command = `node ${args.join(' ')}`
  terminal.value?.writeln(`\x1b[1;36mRunning: ${command}\x1b[0m`)
  terminal.value?.writeln(`\x1b[1;32mNode.js script executed\x1b[0m`)
}

const resize = () => {
  fitAddon.value?.fit()
}

onMounted(() => {
  nextTick(() => {
    initializeTerminal()
  })
  
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  terminal.value?.dispose()
  window.removeEventListener('resize', resize)
})

watch(() => props.theme, () => {
  // Reinitialize terminal with new theme
  if (terminal.value) {
    terminal.value.dispose()
    nextTick(() => {
      initializeTerminal()
    })
  }
})
</script>

<template>
  <div class="h-full flex flex-col bg-gray-900 text-white">
    <div class="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-terminal" class="w-4 h-4" />
        <span class="text-sm font-medium">Terminal</span>
        <UBadge 
          :color="isConnected ? 'green' : 'red'" 
          variant="soft" 
          size="xs"
        >
          {{ isConnected ? 'Connected' : 'Disconnected' }}
        </UBadge>
      </div>
      <div class="flex items-center gap-1">
        <UButton
          icon="i-lucide-square"
          size="xs"
          variant="ghost"
          @click="processCommand('clear')"
        />
        <UButton
          icon="i-lucide-copy"
          size="xs"
          variant="ghost"
          disabled
        />
        <UButton
          icon="i-lucide-settings"
          size="xs"
          variant="ghost"
          disabled
        />
      </div>
    </div>
    
    <div
      ref="terminalRef"
      class="flex-1 p-2 overflow-hidden"
    />
  </div>
</template>

<style>
.xterm {
  height: 100%;
  width: 100%;
}

.xterm-viewport {
  overflow-y: scroll;
  background-color: transparent !important;
}

.xterm-screen {
  margin: 0;
}

.xterm-cursor {
  background-color: #3b82f6 !important;
}

.xterm-selection {
  background-color: rgba(59, 130, 246, 0.3) !important;
}
</style>