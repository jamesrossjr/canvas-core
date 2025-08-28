export type BlockType = 
  | 'text'
  | 'heading'
  | 'paragraph'
  | 'quote'
  | 'callout'
  | 'list'
  | 'task-list'
  | 'code'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'table'
  | 'chart'
  | 'divider'
  | 'columns'
  | 'toggle'
  | 'accordion'
  | 'tabs'
  | 'ai-generated'
  | 'workspace-link'
  | 'embed'

export interface BlockPosition {
  x?: number
  y?: number
  z?: number
  order: number
}

export interface BlockMetadata {
  createdAt: string
  updatedAt: string
  createdBy: string
  version: number
  tags?: string[]
  description?: string
  color?: string
}

export interface BlockPermissions {
  read: string[] // User IDs
  write: string[] // User IDs
  admin: string[] // User IDs
  public: boolean
}

export interface BlockRelationship {
  type: 'link' | 'embed' | 'reference' | 'parent' | 'child'
  targetBlockId: string
  metadata?: Record<string, any>
}

// Base Block Interface
export interface BaseBlock {
  id: string
  type: BlockType
  content: any
  metadata: BlockMetadata
  position: BlockPosition
  permissions?: BlockPermissions
  relationships?: BlockRelationship[]
  workspaceId: string
  documentId?: string
  parentId?: string
  collapsed?: boolean
  focused?: boolean
}

// Text Block Types
export interface TextBlock extends BaseBlock {
  type: 'text' | 'paragraph'
  content: {
    text: string
    formatting?: {
      bold?: boolean
      italic?: boolean
      underline?: boolean
      strikethrough?: boolean
      code?: boolean
      color?: string
      backgroundColor?: string
    }[]
  }
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading'
  content: {
    text: string
    level: 1 | 2 | 3 | 4 | 5 | 6
    anchor?: string
  }
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote'
  content: {
    text: string
    author?: string
    source?: string
    citation?: string
  }
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout'
  content: {
    text: string
    variant: 'info' | 'warning' | 'error' | 'success' | 'note'
    icon?: string
    title?: string
  }
}

// List Block Types
export interface ListBlock extends BaseBlock {
  type: 'list'
  content: {
    items: {
      id: string
      text: string
      level: number
      checked?: boolean
    }[]
    ordered: boolean
  }
}

export interface TaskListBlock extends BaseBlock {
  type: 'task-list'
  content: {
    items: {
      id: string
      text: string
      checked: boolean
      dueDate?: string
      assignee?: string
      priority?: 'low' | 'medium' | 'high'
    }[]
  }
}

// Code Block
export interface CodeBlock extends BaseBlock {
  type: 'code'
  content: {
    code: string
    language: string
    filename?: string
    showLineNumbers?: boolean
    highlightLines?: number[]
    executable?: boolean
    output?: string
  }
}

// Media Block Types
export interface ImageBlock extends BaseBlock {
  type: 'image'
  content: {
    url: string
    alt: string
    caption?: string
    width?: number
    height?: number
    alignment?: 'left' | 'center' | 'right'
  }
}

export interface VideoBlock extends BaseBlock {
  type: 'video'
  content: {
    url: string
    title?: string
    thumbnail?: string
    duration?: number
    autoplay?: boolean
    controls?: boolean
  }
}

export interface AudioBlock extends BaseBlock {
  type: 'audio'
  content: {
    url: string
    title?: string
    duration?: number
    autoplay?: boolean
  }
}

export interface FileBlock extends BaseBlock {
  type: 'file'
  content: {
    url: string
    filename: string
    size: number
    mimeType: string
    downloadable?: boolean
  }
}

// Data Block Types
export interface TableBlock extends BaseBlock {
  type: 'table'
  content: {
    headers: string[]
    rows: string[][]
    sortable?: boolean
    filterable?: boolean
    pagination?: boolean
  }
}

export interface ChartBlock extends BaseBlock {
  type: 'chart'
  content: {
    chartType: 'line' | 'bar' | 'pie' | 'scatter' | 'area'
    data: any[]
    config: Record<string, any>
    dataSource?: string
  }
}

// Layout Block Types
export interface DividerBlock extends BaseBlock {
  type: 'divider'
  content: {
    style: 'line' | 'dashed' | 'dotted' | 'double'
    color?: string
    thickness?: number
  }
}

export interface ColumnsBlock extends BaseBlock {
  type: 'columns'
  content: {
    columns: {
      id: string
      width: number | 'auto'
      blocks: Block[]
    }[]
  }
}

// Interactive Block Types
export interface ToggleBlock extends BaseBlock {
  type: 'toggle'
  content: {
    title: string
    expanded: boolean
    blocks: Block[]
  }
}

export interface AccordionBlock extends BaseBlock {
  type: 'accordion'
  content: {
    items: {
      id: string
      title: string
      content: Block[]
      expanded: boolean
    }[]
    allowMultiple?: boolean
  }
}

export interface TabsBlock extends BaseBlock {
  type: 'tabs'
  content: {
    tabs: {
      id: string
      label: string
      icon?: string
      blocks: Block[]
    }[]
    activeTab: string
  }
}

// AI Block Types
export interface AIGeneratedBlock extends BaseBlock {
  type: 'ai-generated'
  content: {
    prompt: string
    response: string
    model: string
    timestamp: string
    regeneratable: boolean
    accepted?: boolean
  }
}

// Reference Block Types
export interface WorkspaceLinkBlock extends BaseBlock {
  type: 'workspace-link'
  content: {
    targetWorkspaceId: string
    targetDocumentId?: string
    targetBlockId?: string
    title: string
    preview?: string
    thumbnail?: string
  }
}

export interface EmbedBlock extends BaseBlock {
  type: 'embed'
  content: {
    url: string
    embedType: 'iframe' | 'oembed' | 'custom'
    html?: string
    width?: number
    height?: number
    responsive?: boolean
  }
}

// Union type of all block types
export type Block = 
  | TextBlock
  | HeadingBlock
  | QuoteBlock
  | CalloutBlock
  | ListBlock
  | TaskListBlock
  | CodeBlock
  | ImageBlock
  | VideoBlock
  | AudioBlock
  | FileBlock
  | TableBlock
  | ChartBlock
  | DividerBlock
  | ColumnsBlock
  | ToggleBlock
  | AccordionBlock
  | TabsBlock
  | AIGeneratedBlock
  | WorkspaceLinkBlock
  | EmbedBlock

// Document and Workspace Types
export interface Document {
  id: string
  title: string
  blocks: Block[]
  workspaceId: string
  metadata: BlockMetadata
  permissions: BlockPermissions
  template?: string
  version: number
  collaborators: string[]
}

export interface Workspace {
  id: string
  name: string
  description?: string
  documents: Document[]
  owner: string
  members: {
    userId: string
    role: 'owner' | 'admin' | 'editor' | 'viewer'
    joinedAt: string
  }[]
  settings: {
    defaultPermissions: BlockPermissions
    features: {
      collaboration: boolean
      ai: boolean
      versioning: boolean
      comments: boolean
    }
  }
  createdAt: string
  updatedAt: string
}

// Block Editor Types
export interface BlockSelection {
  blockId: string
  startOffset?: number
  endOffset?: number
  type: 'full' | 'partial' | 'cursor'
}

export interface BlockCommand {
  type: string
  payload?: any
  blockId?: string
  position?: BlockPosition
}

// Template Types
export interface BlockTemplate {
  id: string
  name: string
  description: string
  category: string
  blocks: Omit<Block, 'id' | 'workspaceId' | 'metadata'>[]
  preview?: string
  tags: string[]
  public: boolean
  createdBy: string
}

// Collaboration Types
export interface BlockChange {
  type: 'create' | 'update' | 'delete' | 'move'
  blockId: string
  userId: string
  timestamp: string
  before?: Partial<Block>
  after?: Partial<Block>
  position?: BlockPosition
}

export interface CollaborationCursor {
  userId: string
  blockId: string
  position: number
  timestamp: string
  user: {
    name: string
    avatar?: string
    color: string
  }
}