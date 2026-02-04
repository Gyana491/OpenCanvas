"use client"

import React, { useCallback, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  ControlButton,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type OnConnectStart,
  type Connection,
  type Edge,
  type Node,
  type IsValidConnection,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Activity } from 'lucide-react'

import { EditorSidebar } from './editor-sidebar'
import { NodeLibrary } from './node-library'
import { NodeProperties } from './node-properties'
import { ImagenNode } from './nodes/models/imagen-node'
import { TextInputNode } from './nodes/text-input-node'
import { ImageUploadNode } from './nodes/image-upload-node'
import { NanoBananaNode } from './nodes/models/nano-banana-node'
import { NanoBananaProNode } from './nodes/models/nano-banana-pro-node'
import { Veo3Node } from './nodes/models/veo-3-node'

const nodeTypes = {
  imagen: ImagenNode,
  textInput: TextInputNode,
  imageUpload: ImageUploadNode,
  nanoBanana: NanoBananaNode,
  nanoBananaPro: NanoBananaProNode,
  veo3: Veo3Node,
}

const NODES_WITH_PROPERTIES = [
  'imagen',
  'nanoBanana',
  'nanoBananaPro',
  'veo3',
]

type WorkflowNodeData = {
  label: string
} & NodeHandleMeta & Record<string, unknown>

const initialNodes: Node<WorkflowNodeData>[] = []
const initialEdges: Edge[] = []

type HandleKind = 'text' | 'image' | 'video'

type HandleMeta = {
  id: string
  label: string
  type: HandleKind
  required?: boolean
  allowedSourceIds?: string[]
}

type NodeHandleMeta = {
  inputs?: HandleMeta[]
  outputs?: HandleMeta[]
}

const OUTPUT_HANDLE_IDS = {
  text: 'textOutput',
  image: 'imageOutput',
  video: 'videoOutput',
}

const EDGE_COLORS = {
  text: '#38bdf8', // sky-400
  image: '#34d399', // emerald-400
  video: '#a78bfa', // violet-400
  default: '#94a3b8', // slate-400
} as const

function getKindFromSourceHandle(sourceHandle?: string | null): HandleKind | null {
  if (!sourceHandle) {
    return null
  }
  if (sourceHandle === OUTPUT_HANDLE_IDS.text) {
    return 'text'
  }
  if (sourceHandle === OUTPUT_HANDLE_IDS.image) {
    return 'image'
  }
  if (sourceHandle === OUTPUT_HANDLE_IDS.video) {
    return 'video'
  }
  return null
}

function getEdgeColorFromSourceHandle(sourceHandle?: string | null): string {
  const kind = getKindFromSourceHandle(sourceHandle)
  return kind ? EDGE_COLORS[kind] : EDGE_COLORS.default
}

function getNodeHandles(nodeType: string | undefined, data?: any): NodeHandleMeta {
  if (!nodeType) return { inputs: [], outputs: [] }

  switch (nodeType) {
    case 'imagen':
      return {
        inputs: [
          {
            id: 'prompt',
            label: 'Prompt',
            type: 'text',
            required: true,
            allowedSourceIds: [OUTPUT_HANDLE_IDS.text],
          },
        ],
        outputs: [
          {
            id: OUTPUT_HANDLE_IDS.image,
            label: 'Image',
            type: 'image',
          },
        ],
      }
    case 'textInput':
      return {
        outputs: [
          {
            id: OUTPUT_HANDLE_IDS.text,
            label: 'Text',
            type: 'text',
          },
        ],
      }
    case 'imageUpload':
      return {
        outputs: [
          {
            id: OUTPUT_HANDLE_IDS.image,
            label: 'Image',
            type: 'image',
          },
        ],
      }
    case 'nanoBanana':
    case 'nanoBananaPro':
      const imageCount = (data?.imageInputCount as number) || 1;
      return {
        inputs: [
          {
            id: 'prompt',
            label: 'Prompt',
            type: 'text',
            required: true,
            allowedSourceIds: [OUTPUT_HANDLE_IDS.text],
          },
          ...Array.from({ length: imageCount }).map((_, i) => ({
            id: `image_${i}`,
            label: `Ref Image ${i + 1}`,
            type: 'image' as const,
            allowedSourceIds: [OUTPUT_HANDLE_IDS.image],
          })),
        ],
        outputs: [
          {
            id: OUTPUT_HANDLE_IDS.image,
            label: 'Image',
            type: 'image',
          },
        ],
      }
    case 'veo3':
      const refImageCount = (data?.imageInputCount as number) || 0;
      return {
        inputs: [
          {
            id: 'prompt',
            label: 'Prompt',
            type: 'text',
            required: true,
            allowedSourceIds: [OUTPUT_HANDLE_IDS.text],
          },
          {
            id: 'image',
            label: 'First Frame',
            type: 'image',
            allowedSourceIds: [OUTPUT_HANDLE_IDS.image],
          },
          ...Array.from({ length: refImageCount }).map((_, i) => ({
            id: `ref_image_${i}`,
            label: `Ref ${i + 1}`,
            type: 'image' as const,
            allowedSourceIds: [OUTPUT_HANDLE_IDS.image],
          })),
          {
            id: 'video',
            label: 'Extend Video',
            type: 'video',
            allowedSourceIds: [OUTPUT_HANDLE_IDS.video],
          },
        ],
        outputs: [
          {
            id: OUTPUT_HANDLE_IDS.video,
            label: 'Video',
            type: 'video',
          },
        ],
      }
    default:
      return {}
  }
}

function WorkflowEditorInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowNodeData>>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false)
  const [connectingSourceHandle, setConnectingSourceHandle] = useState<string | null>(null)
  const [isAnimated, setIsAnimated] = useState(true)
  const { screenToFlowPosition } = useReactFlow()

  const toggleAnimation = useCallback(() => {
    setIsAnimated((prev) => !prev)
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        animated: !isAnimated,
      }))
    )
  }, [isAnimated, setEdges])

  const updateNodeData = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...data } }
        }
        return node
      })
    )
    // Update selected node state to reflect changes
    setSelectedNode((current: any) =>
      current?.id === nodeId
        ? { ...current, data: { ...current.data, ...data } }
        : current
    )
  }, [setNodes, setSelectedNode])

  // Propagate connected node data through edges
  React.useEffect(() => {
    setNodes((currentNodes) => {
      const updatedNodes = currentNodes.map((node) => {
        const incomingEdges = edges.filter((edge) => edge.target === node.id)

        const connectedData: Record<string, any> = {}

        incomingEdges.forEach((edge) => {
          const sourceNode = currentNodes.find((n) => n.id === edge.source)
          if (!sourceNode) return

          const targetHandle = edge.targetHandle

          console.log('[Data Propagation]', {
            nodeId: node.id,
            nodeType: node.type,
            targetHandle,
            sourceNodeType: sourceNode.type,
            sourceNodeData: sourceNode.data,
            edgeId: edge.id
          });

          // Map source data to target connected fields
          if (targetHandle === 'prompt') {
            if (sourceNode.type === 'textInput') {
              connectedData.connectedPrompt = sourceNode.data.text || ''
              console.log('[Prompt Data]', {
                sourceType: 'textInput',
                textValue: sourceNode.data.text,
                connectedPrompt: connectedData.connectedPrompt
              });
            } else if (sourceNode.data.output) {
              connectedData.connectedPrompt = sourceNode.data.output
              console.log('[Prompt Data]', {
                sourceType: 'output',
                outputValue: sourceNode.data.output,
                connectedPrompt: connectedData.connectedPrompt
              });
            }
          } else if (targetHandle === 'image' || targetHandle?.startsWith('image_')) {
            const dataKey = targetHandle === 'image' ? 'connectedImage' : `connectedImage_${targetHandle.split('_')[1]}`
            console.log('[Image Handle]', {
              targetHandle,
              dataKey,
              hasData: !!sourceNode.data.imageUrl || !!sourceNode.data.output
            });

            if (sourceNode.type === 'imageUpload') {
              connectedData[dataKey] = sourceNode.data.imageUrl || ''
            } else if (sourceNode.type === 'nanoBanana' || sourceNode.type === 'nanoBananaPro' || sourceNode.type === 'imagen') {
              // Get output from model nodes
              connectedData[dataKey] = sourceNode.data.output
            } else if (sourceNode.data.imageOutput) {
              connectedData[dataKey] = sourceNode.data.imageOutput
            }
          }
        })

        console.log('[Final Connected Data]', {
          nodeId: node.id,
          nodeType: node.type,
          connectedData,
          hasPrompt: !!connectedData.connectedPrompt
        });

        // Only update if there are connected data changes
        if (incomingEdges.length > 0) {
          const hasChanges = Object.keys(connectedData).some(
            (key) => node.data[key] !== connectedData[key]
          )

          if (hasChanges) {
            return {
              ...node,
              data: {
                ...node.data,
                ...connectedData,
              },
            }
          }
        }

        // Ensure onUpdateNodeData is available on all nodes
        if (!node.data.onUpdateNodeData) {
          return {
            ...node,
            data: {
              ...node.data,
              onUpdateNodeData: updateNodeData,
            },
          }
        }

        return node
      })

      return updatedNodes
    })
  }, [edges, updateNodeData, setNodes])

  const isValidConnection: IsValidConnection<Edge> = useCallback(
    (edgeOrConnection) => {
      const target = edgeOrConnection.target
      const targetHandle = edgeOrConnection.targetHandle
      const sourceHandle = edgeOrConnection.sourceHandle

      if (!target || !targetHandle || typeof sourceHandle !== 'string') {
        return false
      }

      // Prevent multiple connections to the same target handle
      const existingConnection = edges.find(
        (edge) => edge.target === target && edge.targetHandle === targetHandle
      )
      if (existingConnection) {
        return false // Target handle already has a connection
      }

      const targetNode = nodes.find((node) => node.id === target)
      const handles = targetNode ? getNodeHandles(targetNode.type, targetNode.data) : {}
      const rawInputs = handles.inputs
      const inputs: HandleMeta[] = Array.isArray(rawInputs) ? rawInputs : []
      const targetInput = inputs.find((input) => input.id === targetHandle)
      if (!targetInput) {
        return false
      }
      return (targetInput.allowedSourceIds || []).includes(sourceHandle)
    },
    [nodes, edges]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      const stroke = getEdgeColorFromSourceHandle(connection.sourceHandle)
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: isAnimated,
            style: { stroke, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
          },
          eds
        )
      )
    },
    [setEdges, isAnimated]
  )

  const onConnectStart = useCallback<OnConnectStart>((_, params) => {
    if (params.handleType === 'source') {
      setConnectingSourceHandle(params.handleId)
    }
  }, [])

  const onConnectEnd = useCallback(() => {
    setConnectingSourceHandle(null)
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const nodeType = event.dataTransfer.getData('application/reactflow')
      if (!nodeType) {
        return
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: {
          label: nodeType === 'imagen' ? 'Imagen 4.0' :
            nodeType === 'nanoBanana' ? 'Nano Banana' :
              nodeType === 'nanoBananaPro' ? 'Nano Banana Pro' :
                nodeType === 'veo3' ? 'Veo 3' :
                  nodeType === 'textInput' ? 'Text Input' :
                    nodeType === 'imageUpload' ? 'Image Upload' : nodeType,
          ...(nodeType === 'imagen' && {
            prompt: '',
          }),
          ...(nodeType === 'textInput' && {
            text: '',
          }),
          ...(nodeType === 'imageUpload' && {
            imageUrl: '',
            fileName: '',
          }),
          ...(nodeType === 'nanoBanana' && {
            prompt: '',
            aspectRatio: '1:1',
          }),
          ...(nodeType === 'nanoBananaPro' && {
            prompt: '',
            imageSize: '1K',
            useGoogleSearch: false,
          }),
          ...(nodeType === 'veo3' && {
            prompt: '',
            resolution: '720p',
            durationSeconds: '8',
            aspectRatio: '16:9',
            imageInputCount: 0,
          }),
          ...getNodeHandles(nodeType, {}),
          onUpdateNodeData: updateNodeData,
        },
      } satisfies Node<WorkflowNodeData>

      setNodes((nds) => [...nds, newNode])
    },
    [screenToFlowPosition, setNodes, updateNodeData]
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    setSelectedNode(node)
    if (NODES_WITH_PROPERTIES.includes(node.type)) {
      setIsRightSidebarOpen(true)
    } else {
      setIsRightSidebarOpen(false)
    }
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setIsRightSidebarOpen(false)
  }, [])

  const addNode = useCallback((nodeType: string) => {
    const newNode = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100
      },
      data: {
        label: nodeType === 'imagen' ? 'Imagen 4.0' :
          nodeType === 'nanoBanana' ? 'Nano Banana' :
            nodeType === 'nanoBananaPro' ? 'Nano Banana Pro' :
              nodeType === 'veo3' ? 'Veo 3' :
                nodeType === 'textInput' ? 'Text Input' :
                  nodeType === 'imageUpload' ? 'Image Upload' : nodeType,
        ...(nodeType === 'imagen' && {
          prompt: '',
        }),
        ...(nodeType === 'textInput' && {
          text: '',
        }),
        ...(nodeType === 'imageUpload' && {
          imageUrl: '',
          fileName: '',
        }),
        ...(nodeType === 'nanoBanana' && {
          prompt: '',
          aspectRatio: '1:1',
        }),
        ...(nodeType === 'nanoBananaPro' && {
          prompt: '',
          imageSize: '1K',
          useGoogleSearch: false,
        }),
        ...(nodeType === 'veo3' && {
          prompt: '',
          resolution: '720p',
          durationSeconds: '8',
          aspectRatio: '16:9',
          imageInputCount: 0,
        }),
        ...getNodeHandles(nodeType),
        onUpdateNodeData: updateNodeData,
      },
    } satisfies Node<WorkflowNodeData>
    setNodes((nds) => [...nds, newNode])
  }, [setNodes, updateNodeData])

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Minimal left sidebar with logo, search, layers - always visible */}
      <EditorSidebar
        onSearchClick={() => setIsLibraryOpen(true)}
        onLayersClick={() => setIsLibraryOpen(!isLibraryOpen)}
        isLibraryOpen={isLibraryOpen}
      />

      {/* Full width canvas area */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          connectionLineStyle={{
            stroke: getEdgeColorFromSourceHandle(connectingSourceHandle),
            strokeWidth: 2,
          }}
          fitView
          className="bg-background"
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls position="bottom-center">
            <ControlButton
              onClick={toggleAnimation}
              title={isAnimated ? "Disable Animated Edges" : "Enable Animated Edges"}
              className={isAnimated ? "!bg-blue-500 !border-blue-500 hover:!bg-blue-600" : ""}
            >
              <Activity
                className={`h-4 w-4 ${isAnimated ? 'text-white' : 'text-gray-500'}`}
              />
            </ControlButton>
          </Controls>
        </ReactFlow>

        {/* Node Library - slides from left, positioned after icon bar */}
        <NodeLibrary
          onAddNode={addNode}
          onClose={() => setIsLibraryOpen(false)}
          isOpen={isLibraryOpen}
        />

        {/* Right sidebar for node properties */}
        <NodeProperties
          node={selectedNode}
          onUpdateNode={updateNodeData}
          isOpen={isRightSidebarOpen}
          onClose={() => {
            setIsRightSidebarOpen(false)
            setSelectedNode(null)
          }}
        />
      </div>
    </div>
  )
}

export function WorkflowEditor() {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner />
    </ReactFlowProvider>
  )
}
