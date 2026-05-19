export function parseHashtags(text: string): string[] {
  const matches = text.match(/#[a-zA-Z0-9_]+/g) || [];
  return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))];
}

export function formatHashtag(tag: string): string {
  return tag.startsWith("#") ? tag : `#${tag}`;
}
