"use client"

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FileText, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const TextInputNode = memo(({ data, selected, id }: NodeProps) => {
  const outputs = (data?.outputs || []) as Array<{
    id: string
    label: string
    type: 'text' | 'image'
  }>

  const getHandleTop = (index: number, total: number) => {
    if (total <= 1) {
      return '50%'
    }
    const start = 40
    const end = 60
    const step = (end - start) / (total - 1)
    return `${start + index * step}%`
  }

  const getHandleClass = (kind: 'text' | 'image') =>
    kind === 'image'
      ? '!bg-emerald-400 !border-emerald-200'
      : '!bg-sky-400 !border-sky-200'

  const getLabelClass = (kind: 'text' | 'image') =>
    kind === 'image'
      ? 'text-emerald-300'
      : 'text-sky-300'

  return (
    <Card
      className={`relative min-w-[280px] bg-card border-2 transition-all ${selected ? 'border-primary shadow-lg' : 'border-border'
        }`}
    >
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="font-semibold text-sm">Text Input</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Textarea
            value={(data?.text as string) || ''}
            placeholder="Enter your text or prompt here..."
            className="min-h-[100px] text-sm resize-none nodrag"
            onChange={(e) => {
              if (data?.onUpdateNodeData && typeof data.onUpdateNodeData === 'function') {
                (data.onUpdateNodeData as (id: string, data: any) => void)(id, { text: e.target.value })
              }
            }}
          />
        </div>
      </div>

      {/* Outside Labels */}
      {outputs.map((output, index) => (
        <div
          key={`${output.id}-label`}
          className={`absolute right-[-64px] flex items-center gap-2 text-xs -translate-y-1/2 ${getLabelClass(output.type)}`}
          style={{ top: getHandleTop(index, outputs.length) }}
        >
          <span>{output.label}</span>
        </div>
      ))}

      {/* Output Handles */}
      {outputs.map((output, index) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          className={`!w-3 !h-3 !border-2 ${getHandleClass(output.type)}`}
          style={{ top: getHandleTop(index, outputs.length) }}
        />
      ))}
    </Card>
  )
})

TextInputNode.displayName = 'TextInputNode'
