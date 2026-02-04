import { z } from 'zod';

const apiKeySchema = z.string().min(1);

/**
 * Get Google AI API key from localStorage
 * @returns API key or null if not found/invalid
 */
export function getGoogleApiKey(): string | null {
    if (typeof window === 'undefined') return null;

    const key = localStorage.getItem('google_api_key');

    try {
        if (key) {
            apiKeySchema.parse(key);
            return key;
        }
    } catch {
        return null;
    }

    return null;
}

/**
 * Check if Google provider is active (has valid API key)
 */
export function isGoogleProviderActive(): boolean {
    return getGoogleApiKey() !== null;
}

/**
 * Save Google API key to localStorage
 * @param apiKey - The API key to save
 * @throws {z.ZodError} if API key is invalid
 */
export function saveGoogleApiKey(apiKey: string): void {
    apiKeySchema.parse(apiKey);
    localStorage.setItem('google_api_key', apiKey);
}

/**
 * Remove Google API key from localStorage
 */
export function removeGoogleApiKey(): void {
    localStorage.removeItem('google_api_key');
}
