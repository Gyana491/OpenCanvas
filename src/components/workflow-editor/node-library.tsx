"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Search, Sparkles, Zap, Eye, Box, Video, X, FileText, Image } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

interface NodeLibraryProps {
  onAddNode: (nodeType: string) => void
  onClose: () => void
  isOpen: boolean
}

const nodeCategories: {
  category: string;
  nodes: {
    id: string;
    name: string;
    description: string;
    icon: any;
    color: string;
    badge?: string;
  }[];
}[] = [
    {
      category: "Input Nodes",
      nodes: [
        {
          id: "textInput",
          name: "Text Input",
          description: "Enter text or prompts",
          icon: FileText,
          color: "text-blue-500",
        },
        {
          id: "imageUpload",
          name: "Image Upload",
          description: "Upload images",
          icon: Image,
          color: "text-purple-500",
        },
      ],
    },
    {
      category: "Google AI Models",
      nodes: [
        {
          id: "imagen",
          name: "Imagen 4.0",
          description: "Generate images from text prompts",
          icon: Image,
          color: "text-emerald-500",
          badge: "New",
        },
        {
          id: "nanoBanana",
          name: "Nano Banana",
          description: "Fast image generation (Gemini 2.5 Flash)",
          icon: Image,
          color: "text-orange-500",
          badge: "New",
        },
        {
          id: "nanoBananaPro",
          name: "Nano Banana Pro",
          description: "Advanced image generation with thinking",
          icon: Sparkles,
          color: "text-pink-500",
          badge: "New",
        },
        {
          id: "veo3",
          name: "Veo 3",
          description: "High-fidelity video generation",
          icon: Video,
          color: "text-violet-500",
          badge: "New",
        },
      ],
    },
  ]

export function NodeLibrary({ onAddNode, onClose, isOpen }: NodeLibraryProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-64 border-r bg-background absolute left-0 top-0 bottom-0 z-40 shadow-lg flex flex-col"
        >
          <div className="px-3 py-2 border-b">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Models</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search nodes..."
                className="pl-7 h-8 text-sm"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-3 py-2 space-y-2">
              {nodeCategories.map((category) => (
                <div key={category.category}>
                  <h3 className="text-xs font-semibold mb-1 text-muted-foreground">
                    {category.category}
                  </h3>
                  <div className="space-y-1">
                    {category.nodes.map((node) => {
                      const Icon = node.icon
                      return (
                        <Card
                          key={node.id + category.category}
                          className="p-2 cursor-pointer hover:bg-accent transition-colors relative"
                          onClick={() => onAddNode(node.id)}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData('application/reactflow', node.id)
                            event.dataTransfer.effectAllowed = 'move'
                          }}
                        >
                          {node.badge && (
                            <div className="absolute top-1.5 right-1.5 bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] px-1.5 py-0.5 rounded">
                              {node.badge}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <div className={`${node.color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0 pr-5">
                              <div className="font-medium text-xs">{node.name}</div>
                              <div className="text-[11px] text-muted-foreground line-clamp-1">
                                {node.description}
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
