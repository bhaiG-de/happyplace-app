import { Octokit } from "octokit";

// Initialize Octokit
// Use environment variable for PAT if available, otherwise use unauthenticated requests
const octokit = new Octokit({
  auth: process.env.NEXT_PUBLIC_GITHUB_PAT || undefined,
});

export interface GitHubFile { 
  path: string;
  content?: string; // Content will be fetched separately for non-binary files
  sha: string;
  type: 'blob' | 'tree';
  mode?: string;
  size?: number;
  url?: string; // URL to fetch blob content if needed
}

/**
 * Fetches the default branch name for a repository.
 * @param owner Repository owner.
 * @param repo Repository name.
 * @returns Default branch name.
 */
export async function getDefaultBranch(owner: string, repo: string): Promise<string> {
  try {
    const { data } = await octokit.rest.repos.get({
      owner,
      repo,
    });
    return data.default_branch;
  } catch (error) {
    console.error('Error fetching default branch:', error);
    throw new Error('Could not fetch repository details. Check owner/repo name.');
  }
}

/**
 * Fetches the Git tree for a repository recursively.
 * @param owner Repository owner.
 * @param repo Repository name.
 * @param tree_sha Branch name, commit SHA, or tree SHA.
 * @returns Array of GitHubFile objects representing the tree.
 */
export async function getRepoTree(owner: string, repo: string, tree_sha: string): Promise<GitHubFile[]> {
  try {
    const { data } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha,
      recursive: "true", // Fetch recursively
    });

    if (data.truncated) {
      console.warn('GitHub tree data was truncated. Some files might be missing.');
      // TODO: Handle truncated results if necessary (e.g., make multiple calls or inform user)
    }

    return data.tree
      .filter(item => item.path && (item.type === 'blob' || item.type === 'tree')) // Ensure path exists and type is valid
      .map(item => ({
        path: item.path!,
        sha: item.sha!,
        type: item.type as 'blob' | 'tree',
        mode: item.mode,
        size: item.size,
        url: item.url, // Store blob URL for later fetching
      }));

  } catch (error) {
    console.error('Error fetching repository tree:', error);
    throw new Error('Could not fetch repository tree. Check branch/commit SHA.');
  }
}

/**
 * Fetches the content of a specific blob (file) from GitHub.
 * Assumes content is UTF-8 encoded text.
 * @param owner Repository owner.
 * @param repo Repository name.
 * @param file_sha The SHA of the blob to fetch.
 * @returns The UTF-8 decoded file content.
 */
export async function getBlobContent(owner: string, repo: string, file_sha: string): Promise<string> {
  try {
    const { data } = await octokit.rest.git.getBlob({
      owner,
      repo,
      file_sha,
    });

    if (data.encoding !== 'base64') {
        console.warn(`Unexpected encoding for blob ${file_sha}: ${data.encoding}. Assuming utf-8.`);
        // Attempt to decode directly if not base64, though this might fail for binary
        // In a real app, might need better handling for different encodings/binary files
        return data.content; 
    }

    // Decode base64 content
    const decodedContent = Buffer.from(data.content, 'base64').toString('utf-8');
    return decodedContent;

  } catch (error) {
    console.error(`Error fetching blob content for SHA ${file_sha}:`, error);
    throw new Error(`Could not fetch file content for SHA ${file_sha}.`);
  }
}

/**
 * Fetches the entire repository content (tree structure and file content for blobs).
 * Stores content in memory (as per Phase 1 requirement).
 * @param owner Repository owner.
 * @param repo Repository name.
 * @param branch Optional branch/tag/commit SHA. Fetches default branch if not provided.
 * @returns Array of GitHubFile objects with content populated for blobs.
 */
export async function fetchRepoContents(owner: string, repo: string, branch?: string): Promise<GitHubFile[]> {
    const targetBranch = branch || await getDefaultBranch(owner, repo);
    console.log(`Fetching content for ${owner}/${repo} on branch ${targetBranch}...`);

    const tree = await getRepoTree(owner, repo, targetBranch);

    console.log(`Fetched tree with ${tree.length} items. Fetching blob contents...`);

    // Fetch content for all blobs in parallel
    const contentPromises = tree.map(async (item) => {
        if (item.type === 'blob' && item.sha) {
            try {
                // Basic check to avoid fetching huge files (e.g., > 5MB)
                // Adjust limit as needed
                if (item.size && item.size > 5 * 1024 * 1024) { 
                    console.warn(`Skipping large file (${(item.size / (1024*1024)).toFixed(2)}MB): ${item.path}`);
                    return { ...item, content: `// File content skipped (too large: ${item.size} bytes)` };
                }
                const content = await getBlobContent(owner, repo, item.sha);
                return { ...item, content };
            } catch (error) {
                console.error(`Failed to fetch content for ${item.path}:`, error);
                return { ...item, content: `// Error fetching content: ${error instanceof Error ? error.message : 'Unknown error'}` };
            }
        } else {
            return item; // Keep tree items as is
        }
    });

    const results = await Promise.all(contentPromises);
    console.log(`Finished fetching blob contents.`);
    return results;
}

// TODO: Implement logic for preparing files for WebContainer mounting format (Phase 1/2)
// For Phase 1, we just return the array with content in memory.
// For Phase 2, this might involve creating the nested structure expected by webcontainer.fs.mount
/*
 Example WebContainer mount structure:
 {
   "file": {
     "fileContents": "content..."
   },
   "directory": {
     "directory": {
       "anotherfile.js": {
         "file": {
           "fileContents": "content..."
         }
       }
     }
   }
 }
*/ 