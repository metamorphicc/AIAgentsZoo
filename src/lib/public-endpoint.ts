export function isPublicEndpoint(input: string) {
  try {
    const url = new URL(input);
    return ["https:", "http:"].includes(url.protocol)
      && !url.username && !url.password && !url.search && !url.hash
      && input.length <= 2048;
  } catch {
    return false;
  }
}
