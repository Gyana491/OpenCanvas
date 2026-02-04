"use client"

import { memo, useState, useEffect } from 'react'
import { Handle, Position, NodeProps, useUpdateNodeInternals, useReactFlow, useEdges } from '@xyflow/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Video, Loader2, AlertCircle, Download } from 'lucide-react'
import { getGoogleApiKey } from '@/lib/utils/api-keys'
import { z } from 'zod'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VideoModelNode } from './video-model-node'

const inputSchema = z.object({
    prompt: z.string().min(1, 'Prompt is required'),
    aspectRatio: z.enum(['16:9', '9:16']).optional(),
    resolution: z.enum(['720p', '1080p', '4k']).optional(),
    durationSeconds: z.union([
        z.enum(['4', '6', '8']),
        z.number().transform(n => String(n))
    ]).optional(),
});

export const Veo3Node = memo(({ data, selected, id }: NodeProps) => {
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [progress, setProgress] = useState<string>('');

    // Get React Flow instance to access current node/edge state
    const { getNodes } = useReactFlow();
    const edges = useEdges();

    const prompt = (data?.connectedPrompt as string) || (data?.prompt as string) || '';
    const aspectRatio = (data?.aspectRatio as string) || '16:9';
    const resolution = (data?.resolution as string) || '720p';
    const durationSeconds = String(data?.durationSeconds || '8');
    const imageInputCount = (data?.imageInputCount as number) || 0;

    const updateNodeInternals = useUpdateNodeInternals();

    // Helper function to get fresh data from connected nodes
    const getFreshConnectedData = () => {
        const nodes = getNodes();
        const incomingEdges = edges.filter(edge => edge.target === id);

        let freshPrompt = '';
        const freshImages: { [key: string]: string } = {};
        let freshVideo = '';

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
            // Get first frame image
            else if (targetHandle === 'image') {
                if (sourceNode.type === 'imageUpload') {
                    freshImages['image'] = (sourceNode.data?.imageUrl as string) || '';
                } else if (sourceNode.type === 'nanoBanana' || sourceNode.type === 'nanoBananaPro' || sourceNode.type === 'imagen') {
                    freshImages['image'] = (sourceNode.data?.output as string) || '';
                }
            }
            // Get reference images
            else if (targetHandle?.startsWith('ref_image_')) {
                const imageKey = targetHandle;
                if (sourceNode.type === 'imageUpload') {
                    freshImages[imageKey] = (sourceNode.data?.imageUrl as string) || '';
                } else if (sourceNode.type === 'nanoBanana' || sourceNode.type === 'nanoBananaPro' || sourceNode.type === 'imagen') {
                    freshImages[imageKey] = (sourceNode.data?.output as string) || '';
                }
            }
            // Get video for extension
            else if (targetHandle === 'video') {
                if (sourceNode.type === 'veo3') {
                    freshVideo = (sourceNode.data?.output as string) || '';
                }
            }
        });

        return { freshPrompt, freshImages, freshVideo };
    };

    // Notify React Flow when handles change
    useEffect(() => {
        updateNodeInternals(id);
    }, [imageInputCount, id, updateNodeInternals]);

    const handleAddInput = () => {
        if (data?.onUpdateNodeData) {
            const newCount = imageInputCount + 1;
            if (newCount <= 3) { // Max 3 reference images
                (data.onUpdateNodeData as (id: string, data: any) => void)(id, {
                    imageInputCount: newCount
                });
            }
        }
    };

    const inputs = [
        { id: 'prompt', label: 'Prompt', type: 'text', required: true },
        { id: 'image', label: 'First Frame', type: 'image' },
        ...Array.from({ length: imageInputCount }).map((_, i) => ({
            id: `ref_image_${i}`,
            label: `Ref ${i + 1}`,
            type: 'image'
        })),
        { id: 'video', label: 'Extend Video', type: 'video' }
    ] as any[];

    const outputs = (data?.outputs || [
        { id: 'output', label: 'Video', type: 'video' }
    ]) as any[];

    const pollOperationStatus = async (operationName: string, apiKey: string): Promise<string> => {
        const maxAttempts = 120; // 10 minutes with 5 second intervals
        let attempts = 0;

        while (attempts < maxAttempts) {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/${operationName}`,
                {
                    headers: {
                        'x-goog-api-key': apiKey,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to check operation status: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.done) {
                if (result.error) {
                    throw new Error(result.error.message || 'Video generation failed');
                }

                const videoUri = result.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
                if (!videoUri) {
                    throw new Error('No video URI in response');
                }

                return videoUri;
            }

            // Update progress
            setProgress(`Processing... (${attempts * 5}s elapsed)`);

            // Wait 5 seconds before next poll
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
        }

        throw new Error('Video generation timed out');
    };

    const handleRun = async () => {
        try {
            setIsRunning(true);
            setError('');
            setProgress('Initializing...');

            const apiKey = getGoogleApiKey();
            if (!apiKey) {
                throw new Error('Google AI API key not configured. Please add it in the sidebar.');
            }

            // Get FRESH data from connected nodes
            const { freshPrompt, freshImages, freshVideo } = getFreshConnectedData();
            const finalPrompt = freshPrompt || prompt;

            console.log('[Fresh Data]', { freshPrompt, freshImages, freshVideo, finalPrompt });

            inputSchema.parse({
                prompt: finalPrompt,
                aspectRatio,
                resolution,
                durationSeconds
            });

            setProgress('Preparing request...');

            // Build the request body
            const requestBody: any = {
                instances: [{
                    prompt: finalPrompt
                }],
                parameters: {
                    aspectRatio: aspectRatio,
                    resolution: resolution,
                    durationSeconds: parseInt(durationSeconds)
                }
            };

            // Add first frame image if connected
            if (freshImages['image']) {
                const match = freshImages['image'].match(/^data:(image\/[a-z]+);base64,/);
                const mimeType = match ? match[1] : 'image/png';
                const base64Data = freshImages['image'].includes(',') ? freshImages['image'].split(',')[1] : freshImages['image'];

                requestBody.instances[0].image = {
                    bytesBase64Encoded: base64Data,
                    mimeType: mimeType
                };
            }

            // Add reference images if connected (up to 3)
            const referenceImages = [];
            for (let i = 0; i < imageInputCount; i++) {
                const connectedImage = freshImages[`ref_image_${i}`];
                if (connectedImage) {
                    const match = connectedImage.match(/^data:(image\/[a-z]+);base64,/);
                    const mimeType = match ? match[1] : 'image/png';
                    const base64Data = connectedImage.includes(',') ? connectedImage.split(',')[1] : connectedImage;

                    referenceImages.push({
                        bytesBase64Encoded: base64Data,
                        mimeType: mimeType,
                        referenceType: "asset"
                    });
                }
            }

            if (referenceImages.length > 0) {
                requestBody.parameters.referenceImages = referenceImages;
            }

            // Add video for extension if connected
            if (freshVideo) {
                // Convert blob URL to base64 if needed
                // For now, we'll need to handle this separately
                // Video extension requires the video from a previous generation
                console.warn('Video extension not fully implemented - requires special handling');
            }

            setProgress('Submitting request...');

            // Start video generation
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning`,
                {
                    method: 'POST',
                    headers: {
                        'x-goog-api-key': apiKey,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            const operationName = result.name;

            if (!operationName) {
                throw new Error('No operation name in response');
            }

            setProgress('Generating video...');

            // Poll for completion
            const videoUri = await pollOperationStatus(operationName, apiKey);

            setProgress('Downloading video...');

            // Download the video
            const videoResponse = await fetch(videoUri, {
                headers: {
                    'x-goog-api-key': apiKey,
                },
            });

            if (!videoResponse.ok) {
                throw new Error(`Failed to download video: ${videoResponse.statusText}`);
            }

            const videoBlob = await videoResponse.blob();
            const videoUrl = URL.createObjectURL(videoBlob);

            setOutput(videoUrl);
            setProgress('');

            if (data?.onUpdateNodeData && typeof data.onUpdateNodeData === 'function') {
                (data.onUpdateNodeData as (id: string, data: any) => void)(id, { output: videoUrl });
            }
        } catch (err) {
            if (err instanceof z.ZodError) {
                setError(err.issues[0].message);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to generate video');
            }
            setProgress('');
        } finally {
            setIsRunning(false);
        }
    };

    const handleDownload = () => {
        if (!output) return;
        const link = document.createElement('a');
        link.href = output;
        link.download = `veo-3.1-${Date.now()}.mp4`;
        link.click();
    };

    return (
        <VideoModelNode
            id={id}
            selected={selected}
            title="Veo 3.1"
            icon={Video}
            iconClassName="bg-gradient-to-br from-violet-500 to-indigo-500"
            isRunning={isRunning}
            videoUrl={output}
            error={error}
            progress={progress}
            onRun={handleRun}
            onDownload={handleDownload}
            onAddInput={imageInputCount < 3 ? handleAddInput : undefined}
            inputs={inputs}
            outputs={outputs}
        />
    )
})

Veo3Node.displayName = 'Veo3Node'

export const Veo3Properties = ({ node, onUpdateNode }: { node: any, onUpdateNode: (id: string, data: any) => void }) => {
    const handleDataChange = (field: string, value: any) => {
        onUpdateNode(node.id, { [field]: value })
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="aspectRatio" className="text-xs font-semibold">Aspect Ratio</Label>
                <Select
                    value={node.data.aspectRatio || '16:9'}
                    onValueChange={(value) => handleDataChange('aspectRatio', value)}
                >
                    <SelectTrigger id="aspectRatio" className="h-8 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                        <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="resolution" className="text-xs font-semibold">Resolution</Label>
                <Select
                    value={node.data.resolution || '720p'}
                    onValueChange={(value) => handleDataChange('resolution', value)}
                >
                    <SelectTrigger id="resolution" className="h-8 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="720p">720p (1280x720)</SelectItem>
                        <SelectItem value="1080p">1080p (1920x1080)</SelectItem>
                        <SelectItem value="4k">4K (3840x2160)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="durationSeconds" className="text-xs font-semibold">Duration</Label>
                <Select
                    value={String(node.data.durationSeconds || '8')}
                    onValueChange={(value) => handleDataChange('durationSeconds', value)}
                >
                    <SelectTrigger id="durationSeconds" className="h-8 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="4">4 seconds</SelectItem>
                        <SelectItem value="6">6 seconds</SelectItem>
                        <SelectItem value="8">8 seconds</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
