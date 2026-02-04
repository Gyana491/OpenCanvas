'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Check, X, ExternalLink } from 'lucide-react';
import { z } from 'zod';
import {
    getGoogleApiKey,
    saveGoogleApiKey,
    removeGoogleApiKey,
} from '@/lib/utils/api-keys';

const apiKeySchema = z.object({
    provider: z.literal('google'),
    apiKey: z.string().min(1, 'API key is required'),
});

export function ProviderSettings() {
    const [apiKey, setApiKey] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState('');
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        // Load from localStorage
        const stored = getGoogleApiKey();
        if (stored) {
            setApiKey(stored);
            setIsActive(true);
        }
    }, []);

    const handleSave = () => {
        try {
            // Validate
            apiKeySchema.parse({ provider: 'google', apiKey });

            // Save to localStorage
            saveGoogleApiKey(apiKey);
            setIsActive(true);
            setError('');
        } catch (err) {
            if (err instanceof z.ZodError) {
                setError(err.issues[0].message);
            } else {
                setError('Failed to save API key');
            }
        }
    };

    const handleRemove = () => {
        removeGoogleApiKey();
        setApiKey('');
        setIsActive(false);
        setShowKey(false);
    };

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold mb-1">AI Providers</h2>
                <p className="text-sm text-muted-foreground">
                    Configure your AI provider API keys
                </p>
            </div>

            <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">G</span>
                        </div>
                        <h3 className="font-semibold">Google AI (Gemini)</h3>
                    </div>
                    {isActive ? (
                        <div className="flex items-center gap-1 text-green-600">
                            <Check className="w-4 h-4" />
                            <span className="text-sm font-medium">Active</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                            <X className="w-4 h-4" />
                            <span className="text-sm">Inactive</span>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <div>
                        <Label htmlFor="google-api-key">API Key</Label>
                        <Input
                            id="google-api-key"
                            type={showKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your Google AI API key"
                            className="font-mono text-sm"
                        />
                        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="show-key"
                            checked={showKey}
                            onChange={(e) => setShowKey(e.target.checked)}
                            className="rounded"
                        />
                        <Label htmlFor="show-key" className="text-sm font-normal cursor-pointer">
                            Show API key
                        </Label>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={handleSave} className="flex-1" size="sm">
                            {isActive ? 'Update' : 'Save & Activate'}
                        </Button>
                        {isActive && (
                            <Button onClick={handleRemove} variant="outline" size="sm">
                                Remove
                            </Button>
                        )}
                    </div>

                    <div className="pt-2 border-t">
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                            Get your API key from Google AI Studio
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </Card>

            <div className="text-xs text-muted-foreground space-y-1">
                <p>• API keys are stored locally in your browser</p>
                <p>• Keys are never sent to our servers</p>
                <p>• Clear browser data will remove saved keys</p>
            </div>
        </div>
    );
}
