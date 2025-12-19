import type { FilterType, CropArea } from '../types';

export function applyFilter(imageData: string, filter: FilterType): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (filter === 'original') {
        resolve(imageData);
        return;
      }

      const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageDataObj.data;

      switch (filter) {
        case 'grayscale':
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
          }
          break;

        case 'blackwhite':
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const val = avg > 128 ? 255 : 0;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          }
          break;

        case 'magic':
          // Enhanced document mode - increase contrast and brightness
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            // Increase contrast
            const contrast = 1.5;
            const brightness = 20;
            let val = ((avg - 128) * contrast) + 128 + brightness;
            val = Math.max(0, Math.min(255, val));
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          }
          break;

        case 'color':
          // Enhance colors
          for (let i = 0; i < data.length; i += 4) {
            const saturation = 1.3;
            const brightness = 10;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const avg = (r + g + b) / 3;

            data[i] = Math.min(255, Math.max(0, avg + (r - avg) * saturation + brightness));
            data[i + 1] = Math.min(255, Math.max(0, avg + (g - avg) * saturation + brightness));
            data[i + 2] = Math.min(255, Math.max(0, avg + (b - avg) * saturation + brightness));
          }
          break;
      }

      ctx.putImageData(imageDataObj, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = imageData;
  });
}

export function cropImage(imageData: string, cropArea: CropArea): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Calculate the bounding box
      const minX = Math.min(cropArea.topLeft.x, cropArea.bottomLeft.x);
      const maxX = Math.max(cropArea.topRight.x, cropArea.bottomRight.x);
      const minY = Math.min(cropArea.topLeft.y, cropArea.topRight.y);
      const maxY = Math.max(cropArea.bottomLeft.y, cropArea.bottomRight.y);

      const width = maxX - minX;
      const height = maxY - minY;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = width;
      canvas.height = height;

      // Apply perspective transform (simplified - just crop for now)
      ctx.drawImage(
        img,
        minX, minY, width, height,
        0, 0, width, height
      );

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = imageData;
  });
}

export function perspectiveTransform(
  imageData: string,
  srcPoints: CropArea,
  destWidth: number,
  destHeight: number
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = destWidth;
      canvas.height = destHeight;

      // For a proper perspective transform, we would need to implement
      // a more complex algorithm. For now, we'll use a simplified approach.
      const srcX = Math.min(srcPoints.topLeft.x, srcPoints.bottomLeft.x);
      const srcY = Math.min(srcPoints.topLeft.y, srcPoints.topRight.y);
      const srcWidth = Math.max(srcPoints.topRight.x, srcPoints.bottomRight.x) - srcX;
      const srcHeight = Math.max(srcPoints.bottomLeft.y, srcPoints.bottomRight.y) - srcY;

      ctx.drawImage(
        img,
        srcX, srcY, srcWidth, srcHeight,
        0, 0, destWidth, destHeight
      );

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = imageData;
  });
}

export function detectEdges(imageData: string): Promise<CropArea | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Simple edge detection based on image dimensions
      // In a real app, you'd use computer vision algorithms
      const padding = Math.min(img.width, img.height) * 0.05;

      const detectedArea: CropArea = {
        topLeft: { x: padding, y: padding },
        topRight: { x: img.width - padding, y: padding },
        bottomLeft: { x: padding, y: img.height - padding },
        bottomRight: { x: img.width - padding, y: img.height - padding },
      };

      resolve(detectedArea);
    };
    img.onerror = () => resolve(null);
    img.src = imageData;
  });
}

export function resizeImage(imageData: string, maxWidth: number, maxHeight: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = imageData;
  });
}

export function rotateImage(imageData: string, degrees: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      if (degrees === 90 || degrees === 270 || degrees === -90) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = imageData;
  });
}
