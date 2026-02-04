"use client"

import { memo, useState, useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Image as ImageIcon, Loader2, AlertCircle, Download } from 'lucide-react'
import { experimental_generateImage as generateImage } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getGoogleApiKey } from '@/lib/utils/api-keys'
import { z } from 'zod'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageModelNode } from './image-model-node'

const inputSchema = z.object({
    prompt: z.string().min(1, 'Prompt is required'),
    aspectRatio: z.enum(['1:1', '3:4', '4:3', '9:16', '16:9']).optional(),
});

export const ImagenNode = memo(({ data, selected, id }: NodeProps) => {
    const { id: workflowId } = useParams({ from: '/editor/$id' })
    const [isRunning, setIsRunning] = useState(false);

    const getInitialImage = () => {
        if (data?.assetPath && workflowId) {
            return `opencanvas://${workflowId}/${data.assetPath}`
        }
        return (data?.output as string) || (data?.imageUrl as string) || ''
    }

    const [imageUrl, setImageUrl] = useState<string>(getInitialImage());
    const [error, setError] = useState<string>('');

    const prompt = (data?.connectedPrompt as string) || (data?.prompt as string) || '';
    const aspectRatio = (data?.aspectRatio as string) || '1:1';

    // Update image URL when data changes (e.g. on load)
    useEffect(() => {
        if (!isRunning) {
            setImageUrl(getInitialImage())
        }
    }, [data?.assetPath, data?.output, data?.imageUrl, workflowId])

    const inputs = (data?.inputs || [
        { id: 'prompt', label: 'Prompt', type: 'text', required: true }
    ]) as any[];

    const outputs = (data?.outputs || [
        { id: 'image', label: 'Image', type: 'image' }
    ]) as any[];

    const handleGenerate = async () => {
        try {
            setIsRunning(true);
            setError('');

            const apiKey = getGoogleApiKey();
            if (!apiKey) {
                throw new Error('Google AI API key not configured. Please add it in the providers page.');
            }

            inputSchema.parse({
                prompt,
                aspectRatio: aspectRatio as any
            });

            const google = createGoogleGenerativeAI({ apiKey });

            const { image } = await generateImage({
                model: google.image('imagen-4.0-generate-001'),
                prompt,
                aspectRatio: aspectRatio as any,
            });

            // Convert image to data URL
            const imageDataUrl = `data:image/png;base64,${image.base64}`;
            setImageUrl(imageDataUrl);

            let assetPathStr = '';

            // Save to assets if in workflow
            if (workflowId) {
                try {
                    // Convert base64 to buffer
                    const response = await fetch(imageDataUrl);
                    const buffer = await response.arrayBuffer();

                    const fileName = `imagen_${Date.now()}.png`;

                    const saveResponse = await window.electron.saveAsset(
                        workflowId,
                        id,
                        // @ts-ignore - Electron IPC handles ArrayBuffer
                        buffer,
                        fileName,
                        'image',
                        'image/png'
                    );

                    if (saveResponse.success && saveResponse.data) {
                        assetPathStr = saveResponse.data.filePath;
                        console.log('Saved asset to:', assetPathStr);
                    }
                } catch (saveError) {
                    console.error('Failed to save asset:', saveError);
                }
            }

            // If we have an asset path, construct the protocol URL for the node data
            // This ensures the JSON is small (just a string URL) instead of full base64
            const persistentOutput = assetPathStr && workflowId
                ? `opencanvas://${workflowId}/${assetPathStr}`
                : imageDataUrl;

            if (data?.onUpdateNodeData && typeof data.onUpdateNodeData === 'function') {
                (data.onUpdateNodeData as (id: string, data: any) => void)(id, {
                    output: persistentOutput,
                    assetPath: assetPathStr
                });
            }
        } catch (err) {
            if (err instanceof z.ZodError) {
                setError(err.issues[0].message);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to generate image');
            }
        } finally {
            setIsRunning(false);
        }
    };

    const handleDownload = () => {
        if (!imageUrl) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `imagen-${Date.now()}.png`;
        link.click();
    };

    return (
        <ImageModelNode
            id={id}
            selected={selected}
            title="Imagen 4.0"
            icon={ImageIcon}
            iconClassName="bg-gradient-to-br from-emerald-500 to-teal-500"
            isRunning={isRunning}
            imageUrl={imageUrl}
            error={error}
            onRun={handleGenerate}
            onDownload={handleDownload}
            inputs={inputs}
            outputs={outputs}
        />
    )
})

ImagenNode.displayName = 'ImagenNode'

export const ImagenProperties = ({ node, onUpdateNode }: { node: any, onUpdateNode: (id: string, data: any) => void }) => {
    const handleDataChange = (field: string, value: any) => {
        onUpdateNode(node.id, { [field]: value })
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="aspectRatio" className="text-xs font-semibold">Aspect Ratio</Label>
                <Select
                    value={node.data.aspectRatio || '1:1'}
                    onValueChange={(value) => handleDataChange('aspectRatio', value)}
                >
                    <SelectTrigger id="aspectRatio" className="h-8 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                        <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
                        <SelectItem value="4:3">4:3 (Landscape)</SelectItem>
                        <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                        <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
