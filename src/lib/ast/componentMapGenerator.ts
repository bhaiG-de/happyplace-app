import { Tree } from 'web-tree-sitter';
// Removed import for SyntaxNode
import path from 'path'; // Use path-browserify

// Minimal interface for Tree-sitter nodes based on usage
interface MinimalSyntaxNode {
  type: string;
  children: (MinimalSyntaxNode | null)[]; // Allow nulls in the children array
  // Add other properties used if necessary, e.g., text, startPosition, endPosition
}

// Removed type alias

// Remove the query string and related functions entirely
// const SIMPLER_DEFAULT_EXPORT_QUERY = ...;
// const queryCache = ...;
// function getQueryForLanguage(...) { ... }

/**
 * Checks if a SyntaxNode represents a default export statement.
 * Using MinimalSyntaxNode type now.
 */
function isDefaultExportStatement(node: MinimalSyntaxNode | null): boolean {
  if (!node || node.type !== 'export_statement') {
    return false;
  }

  let hasDefaultKeyword = false;
  let declarationNode: MinimalSyntaxNode | null = null;

  for (const child of node.children) {
    if (!child) continue;

    if (child.type === 'default') {
      hasDefaultKeyword = true;
    } else if (child.type === 'declaration' || 
               child.type === 'function_declaration' || 
               child.type === 'lexical_declaration' || 
               child.type === 'class_declaration' ||
               child.type === 'arrow_function' || 
               child.type === 'identifier' || 
               child.type === 'parenthesized_expression' || 
               child.type === 'object' || 
               child.type === 'call_expression' 
              ) {
      declarationNode = child;
    }
  }
  
  if (!hasDefaultKeyword) {
      return false;
  }
  
  // Check if something is being exported
  return declarationNode !== null || node.children.some((c: MinimalSyntaxNode | null) => {
       if (!c) return false;
       return (
         c.type === 'identifier' || 
         c.type === '_' || 
         c.type === 'call_expression' ||
         c.type === 'parenthesized_expression' ||
         c.type === 'object'
       );
     });
}

/**
 * Generates component maps by detecting default exports and using filenames.
 *
 * @param astRegistry A map where keys are file paths and values are Tree-sitter ASTs.
 * @returns An object containing componentMap (ComponentName -> FilePath) and inverseMap (FilePath -> ComponentName).
 */
export function generateComponentMaps(astRegistry: Map<string, Tree>): {
  componentMap: Map<string, string>;
  inverseMap: Map<string, string>;
} {
  const componentMap = new Map<string, string>();
  const inverseMap = new Map<string, string>();

  for (const [filePath, tree] of astRegistry.entries()) {
    if (!tree || !tree.rootNode || !tree.rootNode.children) continue;

    let componentName: string | null = null;
    let foundDefaultExport = false;

    try {
      // Iterate through top-level nodes to find any default export statement
      // Cast the rootNode to our minimal type for compatibility
      const rootNode = tree.rootNode as unknown as MinimalSyntaxNode | null;
      if (rootNode?.children) {
          for (const topLevelNode of rootNode.children) {
              if (!topLevelNode) continue;
              // Pass the node directly, type checking happens in the function
              if (isDefaultExportStatement(topLevelNode)) {
                  foundDefaultExport = true;
                  break;
              }
          }
      }

      // If a default export was found, derive name from filename
      if (foundDefaultExport) {
        componentName = path.basename(filePath, path.extname(filePath));
        // Handle 'index' files
        if (componentName.toLowerCase() === 'index' && path.dirname(filePath) !== '.') {
          const parentDirName = path.basename(path.dirname(filePath));
          // Avoid generic names like 'src' or potentially others
          if (parentDirName && !['src', 'lib', 'components', 'pages', 'utils'].includes(parentDirName.toLowerCase())) { 
            componentName = parentDirName;
          } else { 
              // Fallback if parent is generic - maybe combine with grandparent?
              // For now, just warn or use 'index' potentially prefixed?
              console.warn(`Using potentially generic name '${componentName}' derived from index file in ${parentDirName}: ${filePath}`);
          }
        }
        console.log(`Default export detected, using derived name for ${filePath}: ${componentName}`);
      } 
      // else { console.debug(`No default export detected in ${filePath}`); }

    } catch (error) {
      console.error(`Error processing file ${filePath} for component map: ${error}`);
    }

    if (foundDefaultExport && componentName) {
      // Convert to PascalCase for component naming convention
      const pascalCaseName = componentName.replace(/[-_](.)/g, (_, c) => c.toUpperCase())
                                      .replace(/^(.)/, (_, c) => c.toUpperCase());

      if (componentMap.has(pascalCaseName)) {
        console.warn(`Duplicate component name \"${pascalCaseName}\" derived from filename. Overwriting mapping from ${componentMap.get(pascalCaseName)} to ${filePath}. Consider renaming files/folders or components.`);
      }
      componentMap.set(pascalCaseName, filePath);
      inverseMap.set(filePath, pascalCaseName);
    } 
  }

  console.log(`Generated component map with ${componentMap.size} entries.`);
  return { componentMap, inverseMap };
}
 