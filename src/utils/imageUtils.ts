/**
 * Helper to process, resize, and compress image files (PNG, JPG, WebP, SVG)
 * so they can be safely stored in Firestore (under 1MB limit) and localStorage.
 */
export async function processAndCompressImage(
  file: File,
  maxDimension = 512,
  quality = 0.88
): Promise<{ dataUrl: string; sizeKb: number; width: number; height: number }> {
  // Check if file is an SVG
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const sizeKb = Math.round(reader.result.length / 1024);
          resolve({
            dataUrl: reader.result,
            sizeKb,
            width: maxDimension,
            height: maxDimension,
          });
        } else {
          reject(new Error("Gagal membaca file SVG"));
        }
      };
      reader.onerror = () => reject(new Error("Gagal membaca file SVG"));
      reader.readAsDataURL(file);
    });
  }

  // Handle standard raster images (PNG, JPEG, WebP, etc.)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while scaling to fit within maxDimension x maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Tidak dapat menginisialisasi canvas untuk kompresi gambar"));
          return;
        }

        // Enable high quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Keep PNG format for transparent logos or WebP/JPEG for opaque
        const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
        const outputMime = isPng ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(outputMime, quality);
        const sizeKb = Math.round(dataUrl.length / 1024);

        resolve({ dataUrl, sizeKb, width, height });
      };

      img.onerror = () => {
        reject(new Error("Format file gambar tidak valid atau rusak"));
      };

      if (typeof reader.result === "string") {
        img.src = reader.result;
      } else {
        reject(new Error("Gagal membaca data file"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Gagal membaca file"));
    };

    reader.readAsDataURL(file);
  });
}
