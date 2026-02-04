/**
 * Downloads media from a URL by fetching it as a blob first.
 * This is more robust than a direct link for custom protocols (opencanvas://)
 * and ensures the browser triggers a download instead of opening in a new tab.
 * 
 * @param url The URL of the media (data: URL, blob: URL, or custom protocol URL)
 * @param fileName The desired filename for the download
 */
export async function downloadMedia(url: string, fileName: string) {
    if (!url) return;

    try {
        // Fetch the resource as a blob
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch media: ${response.statusText}`);

        const blob = await response.blob();

        // Create a local object URL for the blob
        const blobUrl = URL.createObjectURL(blob);

        // Trigger download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;

        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the object URL
        URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Download failed:', error);

        // Fallback: try a direct download if blob fetching fails
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        link.click();
    }
}
