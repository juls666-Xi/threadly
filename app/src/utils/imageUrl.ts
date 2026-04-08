const API_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export function getImageUrl(path: string | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path}`;
}
