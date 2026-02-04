"use client"

import { memo, useRef, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon, Upload, MoreVertical, X } from 'lucide-react'

export const ImageUploadNode = memo(({ data, selected, id }: NodeProps) => {
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

  const [preview, setPreview] = useState<string>((data?.imageUrl as string) || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setPreview(result)
        if (data?.onUpdateNodeData && typeof data.onUpdateNodeData === 'function') {
          (data.onUpdateNodeData as (id: string, data: any) => void)(id, {
            imageUrl: result,
            fileName: file.name
          })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemove = () => {
    setPreview('')
    if (data?.onUpdateNodeData && typeof data.onUpdateNodeData === 'function') {
      (data.onUpdateNodeData as (id: string, data: any) => void)(id, {
        imageUrl: '',
        fileName: ''
      })
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card
      className={`relative min-w-[280px] bg-card border-2 transition-all ${selected ? 'border-primary shadow-lg' : 'border-border'
        }`}
    >
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-purple-500" />
            </div>
            <h3 className="font-semibold text-sm">Image Upload</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-2">
          {preview ? (
            <div className="relative group">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-32 object-cover rounded-md"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity nodrag"
                onClick={handleRemove}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-border rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors nodrag"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-6 h-6 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground text-center">
                Click to upload image
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
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

ImageUploadNode.displayName = 'ImageUploadNode'

export const ImageUploadProperties = ({ node, onUpdateNode }: { node: any, onUpdateNode: (id: string, data: any) => void }) => {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Upload an image directly on the node. No additional configuration needed here.</p>
    </div>
  )
}
