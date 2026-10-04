export type ImageProfile = 'logo';

export type ProcessedImage = {
  buffer: Buffer;
  contentType: 'image/webp';
  width: number;
  height: number;
};

export type StoredImage = ProcessedImage & {
  url: string;
  pathname: string;
};
