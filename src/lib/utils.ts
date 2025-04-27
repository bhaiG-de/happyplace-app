import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  branch?: string; // Optional branch/tag/commit
  path?: string;   // Optional path within the repo
}

/**
 * Parses a GitHub URL to extract owner, repo, branch, and path.
 * Handles various GitHub URL formats.
 * @param url The GitHub URL string.
 * @returns GitHubRepoInfo object or null if parsing fails.
 */
export function parseGitHubUrl(url: string): GitHubRepoInfo | null {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname.slice(1); // Remove leading '/'

    // Standard format: github.com/owner/repo[/tree/branch[/path]] or github.com/owner/repo[/blob/branch/path]
    const parts = pathname.split('/');

    if (parts.length < 2) {
      return null; // Need at least owner/repo
    }

    const owner = parts[0];
    const repo = parts[1].replace('.git', ''); // Remove .git if present
    let branch: string | undefined = undefined;
    let path: string | undefined = undefined;

    // Check for /tree/ or /blob/
    const typeIndex = parts.findIndex(p => p === 'tree' || p === 'blob');
    if (typeIndex !== -1 && parts.length > typeIndex + 1) {
      branch = parts[typeIndex + 1];
      if (parts.length > typeIndex + 2) {
        path = parts.slice(typeIndex + 2).join('/');
      }
    } else if (parts.length > 2 && parts[2] !== 'tree' && parts[2] !== 'blob') {
      // If no /tree/ or /blob/, but more parts exist, assume it's part of the path on the default branch
      // This might be ambiguous, but it's a common case for simple links.
      // A more robust solution might involve checking refs via API if needed.
      // path = parts.slice(2).join('/');
      // For now, let's assume no branch/path if /tree/ or /blob/ is missing
    }

    return { owner, repo, branch, path };

  } catch (error) {
    console.error("Error parsing GitHub URL:", error);
    return null;
  }
}
