export class RequestBodyError extends Error {
  constructor(message: string, readonly status: 400 | 413 | 415) {
    super(message);
    this.name = 'RequestBodyError';
  }
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<Record<string, any>> {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    throw new RequestBodyError('Type de contenu invalide', 415);
  }

  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new RequestBodyError('Corps de requête trop volumineux', 413);
  }

  const reader = request.body?.getReader();
  if (!reader) throw new RequestBodyError('Corps JSON requis', 400);

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new RequestBodyError('Corps de requête trop volumineux', 413);
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof RequestBodyError) throw error;
    throw new RequestBodyError('Corps JSON invalide', 400);
  }

  try {
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const parsed: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new RequestBodyError('Objet JSON requis', 400);
    }
    return parsed as Record<string, any>;
  } catch (error) {
    if (error instanceof RequestBodyError) throw error;
    throw new RequestBodyError('Corps JSON invalide', 400);
  }
}
