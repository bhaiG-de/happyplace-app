'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/shared/Input";
import { Button } from "@/components/shared/Button";
import { Github } from 'lucide-react';
import { parseGitHubUrl } from '@/lib/utils';
// Removed imports for fetchRepoContents, GitHubFile, container utils, WebContainerContext

export default function Home() {
  const router = useRouter();
  const [githubUrl, setGithubUrl] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Simplified loading state

  const handleLoadRepo = async () => {
    setLocalError(null);
    setIsLoading(true);
    console.log(`Parsing URL and navigating for: ${githubUrl}`);

    const parsedUrl = parseGitHubUrl(githubUrl);
    if (!parsedUrl) {
      setLocalError('Invalid GitHub URL format. Use https://github.com/owner/repo');
      setIsLoading(false);
      return;
    }

    try {
      // Directly navigate to the instance page
      // The instance page will handle fetching and loading into Sandpack
      const instanceId = `${parsedUrl.owner}___${parsedUrl.repo}`; // Use ___ separator
      console.log(`Navigating to instance: /instance/${instanceId}`);
      router.push(`/instance/${instanceId}`);
      // No need to explicitly set isLoading to false here, navigation occurs
    } catch (err: unknown) {
      // Catch potential errors during parsing or navigation (less likely)
      console.error('Error during URL parsing or navigation:', err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setLocalError(`Failed to navigate: ${message}`);
      setIsLoading(false); 
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
            disabled={isLoading}
            error={localError || undefined} 
          />
          <Button 
            onClick={handleLoadRepo} 
            disabled={isLoading || !githubUrl} 
            className="whitespace-nowrap"
          >
            {isLoading ? 'Loading...' : 'Load Repo'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Removed getFileLanguage helper as it's no longer needed here
