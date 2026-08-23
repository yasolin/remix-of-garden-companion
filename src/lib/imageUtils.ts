/** Reads an image File and returns a downscaled JPEG data URL.
 *  Large phone photos (5-12 MB base64) make the AI edge-function request fail
 *  with "Failed to fetch", so we always shrink before sending. */
export async function fileToCompressedDataUrl(
  file: File,
  maxSize = 768,
  quality = 0.72
): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Fotoğraf okunamadı"));
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Görsel yüklenemedi"));
      el.src = dataUrl;
    });

    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    const out = canvas.toDataURL("image/jpeg", quality);
    return out.startsWith("data:image") ? out : dataUrl;
  } catch {
    return dataUrl;
  }
}
