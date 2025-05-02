import type { FileSystemAPI /*, FileSystemTree */ } from '@webcontainer/api'; // Removed unused FileSystemTree
import path from 'path'; // Use path-browserify

// Removed all constants and buildPreviewAppTree function.
// Kept only updatePreviewComponentMap.

/**
 * Generates and writes the dynamic componentMap.js file into the preview app's src directory.
 * This should be called whenever the component map changes.
 *
 * @param fs - The WebContainer FileSystemAPI instance.
 * @param componentMap - A map of ComponentName -> Absolute FilePath (e.g., /sandbox/user-project/src/...).
 */
export async function updatePreviewComponentMap(fs: FileSystemAPI, componentMap: Map<string, string>): Promise<void> {
  console.log('Updating preview app componentMap.js...');
  const targetDir = '/sandbox/preview-app/src'; // Target directory remains the same
  const targetFile = `${targetDir}/componentMap.js`; 
  const userProjectRoot = '/sandbox/user-project'; // Base path is now project root

  try {
    // Generate componentMap.js content
    let componentMapObjectString = '{';
    for (const [name, fullPath] of componentMap.entries()) {
      // Make path relative to the NEW user project ROOT and use alias
      const relativePath = path.relative(userProjectRoot, fullPath);
      const aliasedPath = `@user-project/${relativePath.replace(/\\/g, '/')}`;
      const componentKey = name.match(/^[a-zA-Z_$][0-9a-zA-Z_$]*$/) ? name : `'${name}'`;
      componentMapObjectString += `\n  ${componentKey}: '${aliasedPath}',`;
    }
    if (componentMap.size > 0) {
      componentMapObjectString = componentMapObjectString.slice(0, -1); // Remove trailing comma
    }
    componentMapObjectString += '\n}';

    const componentMapFileContent = `// Dynamically generated component map - ${new Date().toISOString()}\nexport const componentMap = ${componentMapObjectString};\n`;

    // Ensure the target directory exists before writing the file
    // This might be redundant if create-vite already created it, but safe to keep.
    try {
      await fs.mkdir(targetDir, { recursive: true });
    } catch (mkdirError: unknown) {
      const code = mkdirError && typeof mkdirError === 'object' && 'code' in mkdirError ? mkdirError.code : null;
      if (code !== 'EEXIST') {
         console.warn(`Could not ensure ${targetDir} exists:`, mkdirError);
      }
    }

    // Write the dynamic map file
    await fs.writeFile(targetFile, componentMapFileContent);

    console.log(`Preview app componentMap.js updated at ${targetFile}.`);

  } catch (error) {
    console.error('Error updating preview component map:', error);
  }
} 