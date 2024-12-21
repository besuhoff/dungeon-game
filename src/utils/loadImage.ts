/**
 * Loads an image from a given URL and returns a promise that resolves with the loaded HTMLImageElement
 * @param src The URL of the image to load
 * @returns Promise that resolves with the loaded HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}
