import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Extract domain from a URL
export function extractDomain(url: string): string {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, '');
  } catch (e) {
    return url;
  }
}

// Generate a deterministic color based on string hash for fallback avatars
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = Math.floor(Math.abs((Math.sin(hash) * 10000) % 1) * 16777215).toString(16);
  return '#' + color.padStart(6, '0');
}

// Parse ISO date to a human readable "time ago" string
export function timeAgo(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    // Use short en-US style to mimic visual design or zh-CN based on your preference.
    // The Frosted Glass design had "1h ago", "2d ago", so we use precise formatting.
    const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);

    if (diffInWeeks > 0) return `${diffInWeeks}w ago`;
    if (diffInDays > 0) return `${diffInDays}d ago`;
    if (diffInHours > 0) return `${diffInHours}h ago`;
    if (diffInMinutes > 0) return `${diffInMinutes}m ago`;
    return 'just now';
  } catch (e) {
    return '';
  }
}
