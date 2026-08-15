import { EinkSubMode } from '../types/music';

// Process an image or SVG data URL onto a canvas with E-Ink dithering
export function renderEinkArtwork(
  sourceUrl: string,
  canvas: HTMLCanvasElement,
  subMode: EinkSubMode = '1bit',
  size: number = 300
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = size;
  canvas.height = size;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    // Draw initial image scaled
    ctx.drawImage(img, 0, 0, size, size);
    
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    const width = size;

    if (subMode === 'grayscale') {
      // Contrast boosted grayscale
      for (let i = 0; i < data.length; i += 4) {
        let lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        // Contrast enhancement
        lum = (lum - 128) * 1.3 + 128;
        lum = Math.min(255, Math.max(0, lum));
        data[i] = lum;
        data[i + 1] = lum;
        data[i + 2] = lum;
      }
    } else if (subMode === '4gray') {
      // 4-level quantization (0, 85, 170, 255)
      for (let i = 0; i < data.length; i += 4) {
        let lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        let level = 0;
        if (lum > 190) level = 255;
        else if (lum > 125) level = 170;
        else if (lum > 60) level = 85;
        else level = 0;

        data[i] = level;
        data[i + 1] = level;
        data[i + 2] = level;
      }
    } else {
      // 1-BIT Floyd-Steinberg Dithering (Monochrome halftone / E-paper look)
      // Convert to grayscale first
      const grayBuffer = new Float32Array(width * size);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          grayBuffer[y * width + x] = lum;
        }
      }

      // Floyd-Steinberg Error Diffusion
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const oldVal = grayBuffer[idx];
          const newVal = oldVal < 128 ? 0 : 255;
          grayBuffer[idx] = newVal;

          const error = oldVal - newVal;

          if (x + 1 < width) grayBuffer[idx + 1] += error * (7 / 16);
          if (y + 1 < size) {
            if (x > 0) grayBuffer[idx + width - 1] += error * (3 / 16);
            grayBuffer[idx + width] += error * (5 / 16);
            if (x + 1 < width) grayBuffer[idx + width + 1] += error * (1 / 16);
          }
        }
      }

      // Write back
      for (let i = 0; i < grayBuffer.length; i++) {
        const val = grayBuffer[i] < 128 ? 17 : 255; // #111111 vs #FFFFFF
        const pixelIdx = i * 4;
        data[pixelIdx] = val;
        data[pixelIdx + 1] = val;
        data[pixelIdx + 2] = val;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };
  img.src = sourceUrl;
}
