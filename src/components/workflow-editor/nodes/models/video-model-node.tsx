"use client"

import { ReactNode } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle, Download, ArrowRight, LucideIcon, Plus, Wand2 } from 'lucide-react'

interface HandleMeta {
    id: string
    label: string
    type: 'text' | 'image' | 'video'
    required?: boolean
}

interface VideoModelNodeProps {
    id: string
    selected: boolean
    title: string
    icon: LucideIcon
    iconClassName?: string
    isRunning: boolean
    videoUrl?: string
    error?: string
    progress?: string
    onRun: () => void
    onDownload?: () => void
    onAddInput?: () => void
    inputs?: HandleMeta[]
    outputs?: HandleMeta[]
}

export function VideoModelNode({
    id,
    selected,
    title,
    icon: Icon,
    iconClassName = "bg-primary",
    isRunning,
    videoUrl,
    error,
    progress,
    onRun,
    onDownload,
    onAddInput,
    inputs = [],
    outputs = []
}: VideoModelNodeProps) {

    const getHandleTop = (index: number, total: number) => {
        if (total <= 1) return '50%'
        const start = 30
        const end = 70
        const step = (end - start) / (total - 1)
        return `${start + index * step}%`
    }

    const getHandleClass = (kind: string) => {
        if (kind === 'image') return '!bg-emerald-400 !border-emerald-200'
        if (kind === 'video') return '!bg-violet-400 !border-violet-200'
        return '!bg-sky-400 !border-sky-200'
    }

    const getLabelClass = (kind: string) => {
        if (kind === 'image') return 'text-emerald-300'
        if (kind === 'video') return 'text-violet-300'
        return 'text-sky-300'
    }

    return (
        <Card className={`relative w-[340px] bg-[#1a1a1a] border-zinc-800 transition-all ${selected ? 'ring-2 ring-primary shadow-2xl scale-[1.02]' : 'shadow-lg'}`}>
            <div className="p-0 overflow-hidden rounded-xl max-h-[600px] flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/50 backdrop-blur-sm flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-inner ${iconClassName}`}>
                            <Icon className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-sm text-zinc-100 tracking-tight">{title}</h3>
                    </div>
                    {videoUrl && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDownload?.();
                            }}
                            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {/* Preview Area */}
                <div className="relative w-full min-h-[300px] max-h-[500px] bg-[#121212] flex items-center justify-center group flex-shrink-0">
                    {/* Checkerboard Pattern */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)',
                        backgroundSize: '20px 20px'
                    }} />

                    {videoUrl ? (
                        <div className="relative w-full h-full p-2 animate-in fade-in duration-500 flex items-center justify-center">
                            <video
                                src={videoUrl}
                                controls
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl bg-black"
                                style={{ maxHeight: '480px' }}
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-zinc-600">
                            <div className="p-6 rounded-full bg-zinc-900/50 border border-zinc-800/50">
                                <Icon className="w-12 h-12 opacity-20" />
                            </div>
                            <p className="text-xs font-medium tracking-wider uppercase opacity-50">Generate {title}</p>
                        </div>
                    )}

                    {/* Loading Overlay */}
                    {isRunning && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 z-10 animate-in fade-in duration-300">
                            <div className="relative">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xs font-semibold text-white tracking-widest uppercase animate-pulse">Generating...</span>
                                {progress && (
                                    <span className="text-[10px] text-zinc-400 font-medium">{progress}</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-4 py-4 border-t border-zinc-800/50 bg-zinc-900/30 flex items-center justify-between gap-3 flex-shrink-0">
                    {onAddInput ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddInput();
                            }}
                            className="h-9 px-4 gap-2 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95 text-xs font-medium"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add reference image
                        </Button>
                    ) : (
                        <div />
                    )}

                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRun();
                        }}
                        disabled={isRunning}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 px-6 rounded-md shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        {isRunning ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Wand2 className="w-4 h-4" />
                        )}
                        <span className="text-xs uppercase tracking-wider">{isRunning ? 'Generating...' : 'Run Model'}</span>
                        {!isRunning && <ArrowRight className="w-3.5 h-3.5 ml-1" />}
                    </Button>
                </div>

                {/* Footer / Error Area */}
                {error && (
                    <div className="px-4 py-3 bg-red-500/10 border-t border-red-500/20 flex items-start gap-3 animate-in slide-in-from-bottom-2 overflow-auto flex-shrink-0 max-h-24">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-red-400 leading-relaxed">{error}</span>
                    </div>
                )}
            </div>

            {/* Input Handles */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col pointer-events-none">
                {inputs.map((input, index) => (
                    <div
                        key={`${input.id}-container`}
                        className="absolute left-0"
                        style={{ top: getHandleTop(index, inputs.length) }}
                    >
                        <div
                            className={`absolute right-full mr-3 flex items-center gap-2 text-[11px] font-bold tracking-tight uppercase whitespace-nowrap transition-opacity ${getLabelClass(input.type)} ${!videoUrl && !selected ? 'opacity-40' : 'opacity-100'}`}
                        >
                            {input.label}{input.required && <span className="text-red-500 ml-0.5">*</span>}
                        </div>
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={input.id}
                            className={`!w-3 !h-3 !border-2 !border-zinc-900 !ring-2 ring-transparent hover:ring-white transition-all pointer-events-auto ${getHandleClass(input.type)}`}
                        />
                    </div>
                ))}
            </div>

            {/* Output Handles */}
            <div className="absolute right-0 top-0 bottom-0 flex flex-col pointer-events-none">
                {outputs.map((output, index) => (
                    <div
                        key={`${output.id}-container`}
                        className="absolute right-0"
                        style={{ top: getHandleTop(index, outputs.length) }}
                    >
                        <div
                            className={`absolute left-full ml-3 flex items-center gap-2 text-[11px] font-bold tracking-tight uppercase whitespace-nowrap transition-opacity ${getLabelClass(output.type)} ${!videoUrl && !selected ? 'opacity-40' : 'opacity-100'}`}
                        >
                            {output.label}
                        </div>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={output.id}
                            className={`!w-3 !h-3 !border-2 !border-zinc-900 !ring-2 ring-transparent hover:ring-white transition-all pointer-events-auto ${getHandleClass(output.type)}`}
                        />
                    </div>
                ))}
            </div>
        </Card>
    )
}
