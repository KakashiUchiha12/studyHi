// app/(lib)/thumbnails.ts
'use client';

// import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import 'pdfjs-dist/build/pdf.worker.entry';

// target size for grid tiles
const THUMB_W = 480;
const THUMB_H = 360;

function drawToThumbCanvas(srcW: number, srcH: number, draw: (ctx: CanvasRenderingContext2D, w:number, h:number) => void): string {
  const canvas = document.createElement('canvas');
  canvas.width = THUMB_W;
  canvas.height = THUMB_H;
  const ctx = canvas.getContext('2d')!;
  // bg
  ctx.fillStyle = '#f5f5f7';
  ctx.fillRect(0, 0, THUMB_W, THUMB_H);

  // fit cover
  const srcRatio = srcW / srcH;
  const dstRatio = THUMB_W / THUMB_H;
  let w = THUMB_W, h = THUMB_H, dx = 0, dy = 0;
  if (srcRatio > dstRatio) {
    // wider than target → fit height
    h = THUMB_H;
    w = Math.round(h * srcRatio);
    dx = Math.round((THUMB_W - w) / 2);
  } else {
    // taller → fit width
    w = THUMB_W;
    h = Math.round(w / srcRatio);
    dy = Math.round((THUMB_H - h) / 2);
  }

  ctx.save();
  ctx.translate(dx, dy);
  draw(ctx, w, h);
  ctx.restore();

  // subtle border
  ctx.strokeStyle = '#e5e7eb';
  ctx.strokeRect(0.5, 0.5, THUMB_W - 1, THUMB_H - 1);

  return canvas.toDataURL('image/webp', 0.9);
}

export async function thumbFromImage(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  return drawToThumbCanvas(bmp.width, bmp.height, (ctx, w, h) => {
    ctx.drawImage(bmp, 0, 0, w, h);
  });
}

export async function thumbFromPdf(file: File): Promise<string> {
  // pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  // const buf = await file.arrayBuffer();
  // const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  // const page = await pdf.getPage(1);
  
  // For now, return a generic PDF thumbnail since PDF.js is not available
  return generateThumbnail(file);
}

export async function thumbFromVideo(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      video.addEventListener('loadeddata', () => resolve(), { once: true });
      video.addEventListener('error', () => reject(new Error('video load error')), { once: true });
    });

    // seek to the start
    video.currentTime = 0;
    await new Promise<void>((resolve) => {
      const handler = () => { resolve(); video.removeEventListener('seeked', handler); };
      video.addEventListener('seeked', handler);
    });

    return drawToThumbCanvas(video.videoWidth, video.videoHeight, (ctx, w, h) => {
      ctx.drawImage(video, 0, 0, w, h);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function thumbFromText(file: File): Promise<string> {
  const text = await file.text();
  const first = text.replace(/\s+/g, ' ').slice(0, 100);

  const canvas = document.createElement('canvas');
  canvas.width = THUMB_W;
  canvas.height = THUMB_H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, THUMB_W, THUMB_H);
  ctx.fillStyle = '#111827';
  ctx.font = '600 18px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  ctx.fillText(file.name, 16, 40);
  ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  wrapText(ctx, first || '(empty)', 16, 70, THUMB_W - 32, 18);
  ctx.strokeStyle = '#e5e7eb';
  ctx.strokeRect(0.5, 0.5, THUMB_W - 1, THUMB_H - 1);
  return canvas.toDataURL('image/webp', 0.9);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

export async function generateThumbnail(file: File): Promise<string> {
  const type = (file.type || '').toLowerCase();
  if (type.startsWith('image/')) return thumbFromImage(file);
  if (type === 'application/pdf') return thumbFromPdf(file);
  if (type.startsWith('video/')) return thumbFromVideo(file);
  if (type.startsWith('text/')) return thumbFromText(file);

  // common office mimes → fallback icon (put your own SVG/PNG in /public)
  const office = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  if (office.includes(type)) return '/thumbs/office-generic.png';

  return '/thumbs/file-generic.png';
}
