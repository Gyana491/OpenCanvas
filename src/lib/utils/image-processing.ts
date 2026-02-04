export async function resolveImageInput(input: string): Promise<{ mimeType: string, base64Data: string }> {
    if (!input) {
        throw new Error('Input image string is empty');
    }

    // specific check for opencanvas protocol
    // The renderer might not be able to fetch opencanvas:// directly if not handled? 
    // Actually, renderer fetch() to registered custom protocol works fine.

    // Check if it's already a data URL
    const match = input.match(/^data:(image\/[a-z]+);base64,/);
    if (match) {
        return {
            mimeType: match[1],
            base64Data: input.split(',')[1]
        };
    }

    // Treat as URL (http, https, blob, opencanvas)
    try {
        const response = await fetch(input);
        if (!response.ok) {
            throw new Error(`Failed to fetch image from URL: ${input}`);
        }
        const blob = await response.blob();
        const mimeType = blob.type || 'image/png';

        // Convert blob to base64
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (!result) {
                    reject(new Error('Failed to convert blob to base64'));
                    return;
                }
                const base64Match = result.match(/^data:(image\/[a-z]+);base64,/);
                const base64Data = result.split(',')[1];
                resolve({
                    mimeType: base64Match ? base64Match[1] : mimeType,
                    base64Data
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error resolving image input:', error);
        throw error;
    }
}
