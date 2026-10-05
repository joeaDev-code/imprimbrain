import crypto from 'node:crypto';
import { del, put } from '@vercel/blob';
import sharp, { type Metadata } from 'sharp';
import type { ImageProfile, ProcessedImage, StoredImage } from '@/lib/images/types';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp']);

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageUploadError';
  }
}

export async function processImage(file: File, profile: ImageProfile): Promise<ProcessedImage> {
  if (!ACCEPTED_MIME_TYPES.has(file.type)) throw new ImageUploadError('Format d’image non autorisé');
  if (!file.size || file.size > MAX_FILE_SIZE) throw new ImageUploadError('L’image doit faire au maximum 5 Mo');

  const input = Buffer.from(await file.arrayBuffer());
  let metadata: Metadata;
  try {
    metadata = await sharp(input, { limitInputPixels: 40_000_000 }).metadata();
  } catch {
    throw new ImageUploadError('Image invalide');
  }
  if (!metadata.format || !ACCEPTED_FORMATS.has(metadata.format) || !metadata.width || !metadata.height) {
    throw new ImageUploadError('Le contenu de l’image n’est pas autorisé');
  }

  const limits = { width: 512, height: 512, quality: 88 };
  const image = sharp(input, { limitInputPixels: 40_000_000 }).rotate().resize({
    width: limits.width,
    height: limits.height,
    fit: 'inside',
    withoutEnlargement: true,
  });
  const output = await image.webp({ quality: limits.quality }).toBuffer({ resolveWithObject: true });
  return { buffer: output.data, contentType: 'image/webp', width: output.info.width, height: output.info.height };
}

export async function storeImage(image: ProcessedImage, profile: ImageProfile): Promise<StoredImage> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new ImageUploadError('Le stockage des images n’est pas configuré');
  const pathname = `images/${profile}/${crypto.randomUUID()}.webp`;
  const blob = await put(pathname, image.buffer, { access: 'public', addRandomSuffix: false, contentType: image.contentType });
  return { ...image, url: blob.url, pathname: blob.pathname };
}

export async function deleteStoredImage(url: string) {
  if (process.env.BLOB_READ_WRITE_TOKEN) await del(url);
}

export async function uploadImage(file: File, profile: ImageProfile): Promise<StoredImage> {
  return storeImage(await processImage(file, profile), profile);
}
