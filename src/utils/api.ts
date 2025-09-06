export function joinUrl(base: string, path: string) {
  const b = (base || "").replace(/\/+$/, "");
  const p = (path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

export function notesUrl(base: string, uploadPath: string, qs?: Record<string, string>) {
  const p = ('/' + (uploadPath || '/notes').replace(/^\/+/, '')).replace(/\/+$/, '');
  const full = joinUrl(base, p);
  const u = new URL(full);
  Object.entries(qs || {}).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  return u.toString();
}
