import { WebContainer, FileSystemTree } from '@webcontainer/api';

/**
 * Mounts a file system tree at the specified mount point
 */
export async function mount(
  webcontainerInstance: WebContainer,
  files: FileSystemTree,
  mountPoint?: string
) {
  if (mountPoint) {
    try {
      await webcontainerInstance.fs.mkdir(mountPoint);
    } catch {
      // Directory might already exist, continue
    }
    await webcontainerInstance.mount(files, { mountPoint });
  } else {
    await webcontainerInstance.mount(files);
  }
}

/**
 * Reads a file from the specified path
 */
export async function readFile(
  webcontainerInstance: WebContainer,
  path: string,
  encoding: 'utf-8' | undefined = 'utf-8'
) {
  return await webcontainerInstance.fs.readFile(path, encoding);
}

/**
 * Writes content to a file at the specified path
 */
export async function writeFile(
  webcontainerInstance: WebContainer,
  path: string,
  content: string
) {
  await webcontainerInstance.fs.writeFile(path, content);
}

/**
 * Creates a directory at the specified path
 */
export async function mkdir(
  webcontainerInstance: WebContainer,
  path: string,
  options?: { recursive?: false }
) {
  await webcontainerInstance.fs.mkdir(path, options);
}

/**
 * Creates a directory recursively at the specified path
 */
export async function mkdirRecursive(
  webcontainerInstance: WebContainer,
  path: string
) {
  await webcontainerInstance.fs.mkdir(path, { recursive: true });
}

/**
 * Removes a file or directory at the specified path
 */
export async function rm(
  webcontainerInstance: WebContainer,
  path: string,
  options?: { recursive?: boolean; force?: boolean }
) {
  await webcontainerInstance.fs.rm(path, options);
}

/**
 * Lists the contents of a directory
 */
export async function readdir(
  webcontainerInstance: WebContainer,
  path: string
) {
  return await webcontainerInstance.fs.readdir(path);
} 