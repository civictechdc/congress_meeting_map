import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(timestamp: string): string {
  // Convert MM:SS format to readable format
  const [minutes, seconds] = timestamp.split(':').map(Number);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function getAuthorInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function highlightSearchMatch(text: string, query: string): string {
  if (!query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-accent-amber/30">$1</mark>');
}
