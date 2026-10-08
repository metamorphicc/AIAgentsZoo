const maxBodyBytes = 16_384;

// Read incrementally: Content-Length alone does not bound a chunked request.
export async function readJsonBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > maxBodyBytes) return null;
  if (!request.body) return {};
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBodyBytes) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return text ? JSON.parse(text) : {};
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}
