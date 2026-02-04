"use client"

import { memo, useState, useEffect } from 'react'
import { Handle, Position, NodeProps, useUpdateNodeInternals, useReactFlow, useEdges } from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Image as ImageIcon, Loader2, AlertCircle, Download } from 'lucide-react'
import { getGoogleApiKey } from '@/lib/utils/api-keys'
import { z } from 'zod'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageModelNode } from './image-model-node'

const inputSchema = z.object({
    prompt: z.string().min(1, 'Prompt is required'),
    aspectRatio: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']).optional(),
});

export const NanoBananaNode = memo(({ data, selected, id }: NodeProps) => {
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState<string>('');
    const [error, setError] = useState<string>('');

    // Get React Flow instance to access current node/edge state
    const { getNodes } = useReactFlow();
    const edges = useEdges();

    const prompt = (data?.connectedPrompt as string) || (data?.prompt as string) || '';
    const aspectRatio = (data?.aspectRatio as string) || '1:1';
    const imageInputCount = (data?.imageInputCount as number) || 0;

    const updateNodeInternals = useUpdateNodeInternals();

    // Helper function to get fresh data from connected nodes
    const getFreshConnectedData = () => {
        const nodes = getNodes();
        const incomingEdges = edges.filter(edge => edge.target === id);

        let freshPrompt = '';
        const freshImages: { [key: string]: string } = {};

        incomingEdges.forEach(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            if (!sourceNode) return;

            const targetHandle = edge.targetHandle;

            // Get prompt from text input
            if (targetHandle === 'prompt') {
                if (sourceNode.type === 'textInput') {
                    freshPrompt = (sourceNode.data?.text as string) || '';
                }
            }
            // Get images from image handles
            else if (targetHandle === 'image' || targetHandle?.startsWith('image_')) {
                const imageKey = targetHandle === 'image' ? 'image' : targetHandle;
                if (sourceNode.type === 'imageUpload') {
                    freshImages[imageKey] = (sourceNode.data?.imageUrl as string) || '';
                } else if (sourceNode.type === 'nanoBanana' || sourceNode.type === 'nanoBananaPro' || sourceNode.type === 'imagen') {
                    freshImages[imageKey] = (sourceNode.data?.output as string) || '';
                }
            }
        });

        return { freshPrompt, freshImages };
    };

    // Notify React Flow when handles change
    useEffect(() => {
        updateNodeInternals(id);
    }, [imageInputCount, id, updateNodeInternals]);

    const handleAddInput = () => {
        if (data?.onUpdateNodeData) {
            (data.onUpdateNodeData as (id: string, data: any) => void)(id, {
                imageInputCount: imageInputCount + 1
            });
        }
    };

    const inputs = [
        { id: 'prompt', label: 'Prompt', type: 'text', required: true },
        ...Array.from({ length: imageInputCount }).map((_, i) => ({
            id: `image_${i}`,
            label: `Ref Image ${i + 1}`,
            type: 'image'
        }))
    ] as any[];

    const outputs = (data?.outputs || [
        { id: 'output', label: 'Image', type: 'image' }
    ]) as any[];

    const handleRun = async () => {
        try {
            setIsRunning(true);
            setError('');

            const apiKey = getGoogleApiKey();
            if (!apiKey) {
                throw new Error('Google AI API key not configured. Please add it in the sidebar.');
            }

            // Get FRESH data from connected nodes
            const { freshPrompt, freshImages } = getFreshConnectedData();
            const finalPrompt = freshPrompt || prompt;

            console.log('[Fresh Data]', { freshPrompt, freshImages, finalPrompt });

            inputSchema.parse({
                prompt: finalPrompt,
                aspectRatio
            });

            const contentsParts: any[] = [{ text: finalPrompt }];

            // Handle multiple reference images if connected (using FRESH images)
            for (let i = 0; i < imageInputCount; i++) {
                const connectedImage = freshImages[`image_${i}`];
                if (connectedImage) {
                    const match = connectedImage.match(/^data:(image\/[a-z]+);base64,/);
                    const mimeType = match ? match[1] : 'image/png';
                    const base64Data = connectedImage.includes(',') ? connectedImage.split(',')[1] : connectedImage;

                    contentsParts.push({
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    });
                }
            }

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: contentsParts
                        }],
                        generationConfig: {
                            responseModalities: ['TEXT', 'IMAGE'],
                            imageConfig: {
                                aspectRatio: aspectRatio
                            }
                        }
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const result = await response.json();

            console.log('[Nano Banana API Response]', {
                fullResponse: result,
                hasCandidates: !!result.candidates,
                candidatesLength: result.candidates?.length,
                firstCandidate: result.candidates?.[0],
                parts: result.candidates?.[0]?.content?.parts,
            });

            // Extract all parts and filter for images
            const parts = result.candidates?.[0]?.content?.parts || [];
            const imageParts = parts.filter((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

            if (imageParts.length > 0) {
                // Get the last image part (in case there are multiple)
                const imageData = imageParts[imageParts.length - 1].inlineData.data;
                const mimeType = imageParts[imageParts.length - 1].inlineData.mimeType || 'image/png';
                const imageUrl = `data:${mimeType};base64,${imageData}`;

                console.log('[Image Generated]', {
                    mimeType,
                    dataLength: imageData.length,
                    imageUrl: imageUrl.substring(0, 100) + '...'
                });

                setOutput(imageUrl);

                if (data?.onUpdateNodeData && typeof data.onUpdateNodeData === 'function') {
                    (data.onUpdateNodeData as (id: string, data: any) => void)(id, { output: imageUrl });
                }
            } else {
                console.error('[API Response Error]', {
                    candidates: result.candidates,
                    error: result.error,
                    parts,
                    fullResponse: JSON.stringify(result, null, 2)
                });
                throw new Error('No image data in response. Check console for details.');
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
        if (!output) return;
        const link = document.createElement('a');
        link.href = output;
        link.download = `nano-banana-${Date.now()}.png`;
        link.click();
    };

    return (
        <ImageModelNode
            id={id}
            selected={selected}
            title="Nano Banana"
            icon={ImageIcon}
            iconClassName="bg-gradient-to-br from-yellow-500 to-orange-500"
            isRunning={isRunning}
            imageUrl={output}
            error={error}
            onRun={handleRun}
            onDownload={handleDownload}
            onAddInput={handleAddInput}
            inputs={inputs}
            outputs={outputs}
        />
    )
})

NanoBananaNode.displayName = 'NanoBananaNode'

export const NanoBananaProperties = ({ node, onUpdateNode }: { node: any, onUpdateNode: (id: string, data: any) => void }) => {
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
                        <SelectItem value="3:2">3:2</SelectItem>
                        <SelectItem value="2:3">2:3</SelectItem>
                        <SelectItem value="16:10">16:10</SelectItem>
                        <SelectItem value="10:16">10:16</SelectItem>
                        <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
