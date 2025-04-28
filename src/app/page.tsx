'use client'; // Need client component for state and event handlers

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/shared/Input";
import { Button } from "@/components/shared/Button";
// import { CodeEditor } from "@/components/code/Editor"; // Removed unused import
import { Github } from 'lucide-react';
import { parseGitHubUrl } from '@/lib/utils';
import { fetchRepoContents /*, GitHubFile*/ } from '@/lib/github/repo'; // Removed unused GitHubFile type
import { useWebContainerContext } from '@/context/WebContainerContext'; // Import context hook
import { convertGitHubFilesToFsTree } from '@/lib/container/utils'; // Import the converter

export default function Home() {
  const router = useRouter();
  const { setFilesToMount } = useWebContainerContext(); // Get the function from context
  const [githubUrl, setGithubUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // No longer need local state for loadedFiles or selectedFile here if navigating immediately
  // const [loadedFiles, setLoadedFiles] = useState<GitHubFile[] | null>(null);
  // const [selectedFile, setSelectedFile] = useState<GitHubFile | null>(null);

  const handleLoadRepo = async () => {
    setIsLoading(true);
    setError(null);
    // Reset context files in case of previous error?
    // setFilesToMount(null); 
    console.log('Attempting to load repo from:', githubUrl);

    const repoInfo = parseGitHubUrl(githubUrl);

    if (!repoInfo) {
      setError('Invalid GitHub URL format.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch files from GitHub
      const files = await fetchRepoContents(repoInfo.owner, repoInfo.repo, repoInfo.branch);
      console.log(`Successfully fetched ${files.length} items from ${repoInfo.owner}/${repoInfo.repo}`);
      
      // 2. Convert to FileSystemTree
      const fileSystemTree = convertGitHubFilesToFsTree(files);
      console.log('Converted fetched files to FileSystemTree structure.');

      // 3. Set files in context for the hook to mount
      setFilesToMount(fileSystemTree);

      // 4. Generate instance ID (temporary)
      const instanceId = `${repoInfo.owner}-${repoInfo.repo}-${Date.now()}`;
      
      // 5. Navigate to the instance page
      console.log(`Navigating to instance: /instance/${instanceId}`);
      router.push(`/instance/${instanceId}`);
      // Note: isLoading will be reset when the component unmounts upon navigation

    } catch (err) {
      console.error('Error loading repo or setting files:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred.';
      setError(`Failed to load repository: ${errorMessage}`);
      setIsLoading(false); // Ensure loading stops on error
    }
    // No finally block needed for setIsLoading(false) if navigating away on success
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
            disabled={isLoading}
            error={error || undefined}
          />
          <Button 
            onClick={handleLoadRepo} 
            disabled={isLoading || !githubUrl}
            className="whitespace-nowrap"
          >
            {isLoading ? 'Loading...' : 'Load Repo'}
          </Button>
        </div>
        {/* Removed preview editor and file list display from Home page */}
      </div>
    </div>
  );
}

// Removed getFileLanguage helper as it's no longer needed here
