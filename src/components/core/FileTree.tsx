import React, { useState } from 'react';
import { cn } from '@/lib/utils'; // shadcn utility for classnames

// Types for the file system tree
export interface FileNode {
  file: { contents: string | Uint8Array };
}
export interface DirectoryNode {
  directory: FileSystemTree;
}
export interface SymlinkNode {
  symlink: string;
}
export type FileSystemTree = {
  [name: string]: FileNode | DirectoryNode | SymlinkNode;
};

type FileTreeProps = {
  tree: FileSystemTree;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  basePath?: string;
};

function FileTreeNode({
  name,
  node,
  path,
  selectedPath,
  onSelect,
}: {
  name: string;
  node: FileNode | DirectoryNode | SymlinkNode;
  path: string;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isDir = 'directory' in node;
  const isSelected = selectedPath === path;

  return (
    <div>
      <div
        className={cn(
          'flex items-center cursor-pointer px-2 py-1 rounded hover:bg-accent',
          isSelected && 'bg-accent text-accent-foreground font-semibold'
        )}
        onClick={() => {
          if (isDir) setOpen((o) => !o);
          onSelect(path);
        }}
      >
        {isDir ? (
          <span className="mr-1">{open ? '▼' : '▶'}</span>
        ) : (
          <span className="mr-1" />
        )}
        <span>{name}</span>
      </div>
      {isDir && open && (
        <div className="ml-4 border-l border-border pl-2">
          {Object.entries((node as DirectoryNode).directory).map(([child, childNode]) => (
            <FileTreeNode
              key={child}
              name={child}
              node={childNode}
              path={path + '/' + child}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ tree, selectedPath, onSelect, basePath = '' }: FileTreeProps) {
  return (
    <div className="text-sm select-none">
      {Object.entries(tree).map(([name, node]) => (
        <FileTreeNode
          key={name}
          name={name}
          node={node}
          path={basePath + '/' + name}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
} 