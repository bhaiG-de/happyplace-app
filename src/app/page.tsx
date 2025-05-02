'use client'; // Need client component for state and event handlers

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/shared/Input";
import { Button } from "@/components/shared/Button";
// import { CodeEditor } from "@/components/code/Editor"; // Removed unused import
import { Github } from 'lucide-react';
import { parseGitHubUrl } from '@/lib/utils';
import { fetchRepoContents, GitHubFile } from '@/lib/github/repo'; // Re-added fetchRepoContents
import { convertGitHubFilesToFsTree, buildSandboxFileSystemTree } from '@/lib/container/utils'; // Re-added buildSandboxFileSystemTree
import { useWebContainerContext } from '@/context/WebContainerContext'; // Import context hook

export default function Home() {
  const router = useRouter();
  // Get the reverted bootAndMountFiles function
  const { bootAndMountFiles, isLoading: isContextLoading, loadingMessage, error: contextError } = useWebContainerContext(); 
  const [githubUrl, setGithubUrl] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isFetchingRepo, setIsFetchingRepo] = useState(false); // Local state for fetch step

  // Combine errors for display
  const displayError = localError || (contextError ? `Error: ${contextError.message}` : null);
  // Combine loading states
  const isLoading = isFetchingRepo || isContextLoading;
  // Determine display message
  const displayLoadingMessage = isFetchingRepo ? 'Fetching Repo...' : (loadingMessage || 'Loading...');

  const handleLoadRepo = async () => {
    setLocalError(null);
    setIsFetchingRepo(true); // Start fetching repo
    console.log(`Attempting to load repo from: ${githubUrl}`);

    const parsedUrl = parseGitHubUrl(githubUrl);
    if (!parsedUrl) {
      setLocalError('Invalid GitHub URL format. Use https://github.com/owner/repo');
      setIsFetchingRepo(false);
      return;
    }

    try {
      // 1. Fetch files from GitHub
      console.log('Fetching repo contents...');
      const files: GitHubFile[] = await fetchRepoContents(parsedUrl.owner, parsedUrl.repo, parsedUrl.branch);
      console.log(`Successfully fetched ${files.length} items from ${parsedUrl.owner}/${parsedUrl.repo}`);
      setIsFetchingRepo(false); // Finished fetching repo part

      // 2. Convert user files to FileSystemTree
      const userProjectTree = convertGitHubFilesToFsTree(files);
      console.log('Converted fetched files to user project FileSystemTree structure.');

      // 3. Build the complete sandbox FileSystemTree (with preview placeholder)
      const sandboxTree = buildSandboxFileSystemTree(userProjectTree);

      // 4. Boot WebContainer AND Mount the combined tree
      console.log('Calling bootAndMountFiles with combined sandbox tree...');
      await bootAndMountFiles(sandboxTree); // Wait for boot and mount to complete
      console.log('bootAndMountFiles completed successfully (or handled error internally).');

      // Check for errors from the context after the operation
      if (contextError) {
          console.error("Error occurred during boot/mount:", contextError);
          return; // Stop further execution
      }

      // 5. Navigate 
      const instanceId = `${parsedUrl.owner}-${parsedUrl.repo}-${Date.now()}`;
      console.log(`Navigating to instance: /instance/${instanceId}`);
      router.push(`/instance/${instanceId}`);

    } catch (err: unknown) {
      console.error('Error during loading process:', err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setLocalError(`Failed to load repository: ${message}`);
      setIsFetchingRepo(false); // Ensure fetch loading state is reset on error
      // Context isLoading will be handled by the hook's finally block
    }
  };

  return (
    <div className="flex flex-col items-center justify-center pt-20">
      <h1 className="text-3xl font-bold mb-8">Load a GitHub Repository</h1>
      <div className="w-full max-w-lg flex flex-col gap-4">
        <div className="flex gap-2 items-start">
          <Input
            fullWidth
            placeholder="Enter public GitHub repository URL (e.g., https://github.com/owner/repo)"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            icon={<Github size={16} />}
            iconPosition="left"
            disabled={isLoading} // Use combined loading state
            error={displayError || undefined} // Use combined error state
          />
          <Button 
            onClick={handleLoadRepo} 
            disabled={isLoading || !githubUrl} // Use combined loading state
            className="whitespace-nowrap"
          >
            {/* Use combined loading message */} 
            {isLoading ? displayLoadingMessage : 'Load Repo'}
          </Button>
        </div>
        {/* Optional: Display detailed loading message */} 
        {/* {isLoading && loadingMessage && <p className="text-sm text-muted-foreground">{loadingMessage}</p>} */}
      </div>
    </div>
  );
}

// Removed getFileLanguage helper as it's no longer needed here
