/**
 * Client-side image preprocessing to improve OCR accuracy on receipts.
 * Uses Canvas API only — zero external dependencies.
 */

export function preprocessImage(imageDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(imageDataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 1. Grayscale (luminosity method)
        for (let i = 0; i < data.length; i += 4) {
          const gray = Math.round(
            0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          );
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }

        // 2. Contrast enhancement — histogram stretch with 1% clip on each end
        //    so outlier pixels (hot/dead pixels, borders) don't compress the
        //    useful intensity range.
        const totalPixels = data.length / 4;
        const clipCount = Math.floor(totalPixels * 0.01);

        const histogram = new Uint32Array(256);
        for (let i = 0; i < data.length; i += 4) {
          histogram[data[i]]++;
        }

        let low = 0;
        let cumulative = 0;
        for (let i = 0; i < 256; i++) {
          cumulative += histogram[i];
          if (cumulative >= clipCount) {
            low = i;
            break;
          }
        }

        let high = 255;
        cumulative = 0;
        for (let i = 255; i >= 0; i--) {
          cumulative += histogram[i];
          if (cumulative >= clipCount) {
            high = i;
            break;
          }
        }

        const range = high - low || 1;
        for (let i = 0; i < data.length; i += 4) {
          const val = Math.min(
            255,
            Math.max(0, Math.round(((data[i] - low) / range) * 255))
          );
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(imageDataUrl);
      }
    };

    img.onerror = () => resolve(imageDataUrl);
    img.src = imageDataUrl;
  });
}
