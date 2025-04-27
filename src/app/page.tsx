'use client'; // Need client component for state and event handlers

import { useState } from 'react';
import { Input } from "@/components/shared/Input";
import { Button } from "@/components/shared/Button";
import { CodeEditor } from "@/components/code/Editor"; // Import the editor
import { Github } from 'lucide-react'; // Add an icon
import { parseGitHubUrl } from '@/lib/utils'; // Import the parser
import { fetchRepoContents, GitHubFile } from '@/lib/github/repo'; // Import GitHub fetcher

export default function Home() {
  const [githubUrl, setGithubUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedFiles, setLoadedFiles] = useState<GitHubFile[] | null>(null);
  const [selectedFile, setSelectedFile] = useState<GitHubFile | null>(null); // State for the file shown in editor

  const handleLoadRepo = async () => {
    setIsLoading(true);
    setError(null);
    setLoadedFiles(null);
    setSelectedFile(null); // Reset selected file
    console.log('Attempting to load repo from:', githubUrl);

    const repoInfo = parseGitHubUrl(githubUrl);

    if (!repoInfo) {
      setError('Invalid GitHub URL format.');
      setIsLoading(false);
      return;
    }

    try {
      const files = await fetchRepoContents(repoInfo.owner, repoInfo.repo, repoInfo.branch);
      setLoadedFiles(files);
      console.log(`Successfully loaded ${files.length} items from ${repoInfo.owner}/${repoInfo.repo}`);
      
      // Display the first text file found (simple example)
      const firstFile = files.find(f => f.type === 'blob' && f.content !== undefined); 
      setSelectedFile(firstFile || null);

    } catch (err) {
      console.error('Error loading repo:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred.';
      setError(`Failed to load repository: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center pt-20">
      <h1 className="text-3xl font-bold mb-8">Load a GitHub Repository</h1>
      <div className="w-full max-w-lg flex flex-col gap-4">
        <div className="flex gap-2 items-start"> {/* Use items-start for error alignment */} 
          <Input
            fullWidth
            placeholder="Enter public GitHub repository URL (e.g., https://github.com/owner/repo)"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            icon={<Github size={16} />} // Add GitHub icon
            iconPosition="left"
            disabled={isLoading}
            error={error || undefined} // Show error message below input
          />
          <Button 
            onClick={handleLoadRepo} 
            disabled={isLoading || !githubUrl}
            className="whitespace-nowrap" // Prevent button text wrapping
          >
            {isLoading ? 'Loading...' : 'Load Repo'}
          </Button>
        </div>
        {/* Optional: Display loaded repo info or error message here */} 
        {/* Display simple status for now */} 
        {loadedFiles && (
          <p className="text-success text-sm mt-2">
            Successfully loaded {loadedFiles.length} file/directory entries.
          </p>
        )}
        {/* Error message is now handled by the Input component prop */} 
        {/* {error && <p className="text-error text-sm mt-2">{error}</p>} */}
      </div>
      {/* Placeholder for displaying loaded files/editor later */}
      {selectedFile && (
        <div className="w-full max-w-4xl mt-8">
          <h2 className="text-xl font-semibold mb-2">Editor ({selectedFile.path})</h2>
          <CodeEditor
            height="500px"
            language={getFileLanguage(selectedFile.path)} // Basic language detection
            value={selectedFile.content}
            options={{ readOnly: true }} // Pass readOnly via options
          />
        </div>
      )}
    </div>
  );
}

// Helper function to guess language from file extension
function getFileLanguage(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'html':
      return 'html';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
}
