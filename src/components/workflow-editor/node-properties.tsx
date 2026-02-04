"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { ImagenProperties } from "./nodes/models/imagen-node"
import { ImageUploadProperties } from "./nodes/image-upload-node"
import { NanoBananaProperties } from "./nodes/models/nano-banana-node"
import { NanoBananaProProperties } from "./nodes/models/nano-banana-pro-node"
import { Veo3Properties } from "./nodes/models/veo-3-node"

interface NodePropertiesProps {
  node: any
  onUpdateNode: (nodeId: string, data: any) => void
  isOpen: boolean
  onClose: () => void
}

const PROPERTY_COMPONENTS: Record<string, any> = {

  imagen: ImagenProperties,
  imageUpload: ImageUploadProperties,
  nanoBanana: NanoBananaProperties,
  nanoBananaPro: NanoBananaProProperties,
  veo3: Veo3Properties,
}

export function NodeProperties({ node, onUpdateNode, isOpen, onClose }: NodePropertiesProps) {
  if (!node) return null;

  const PropertyComponent = PROPERTY_COMPONENTS[node.type];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-80 border-l bg-background absolute right-0 top-0 bottom-0 z-50 shadow-lg flex flex-col"
        >
          <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/20">
            <div>
              <h2 className="text-sm font-semibold">Node Settings</h2>
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">{node.data.label}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-4 py-4">
              {PropertyComponent ? (
                <PropertyComponent node={node} onUpdateNode={onUpdateNode} />
              ) : (
                <p className="text-xs text-muted-foreground italic">No configurable properties for this node.</p>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
