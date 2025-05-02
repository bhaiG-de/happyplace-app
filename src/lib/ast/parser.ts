// Dynamically import Parser when needed
let Parser: typeof import('web-tree-sitter').Parser | null = null;
let Language: typeof import('web-tree-sitter').Language | null = null;

// Global initialization promise
let parserInitialized: Promise<void> | null = null;

// Cache for loaded languages
const languageCache = new Map<string, import('web-tree-sitter').Language>();

/**
 * Initializes the Tree-sitter parser library.
 * Must be called once before any parsing operations.
 */
export async function initializeParser(): Promise<void> {
  if (!parserInitialized) {
    parserInitialized = (async () => {
      // Dynamically import the library here
      const TreeSitter = await import('web-tree-sitter');
      Parser = TreeSitter.Parser;
      Language = TreeSitter.Language;

      await Parser.init({
        // Optional: Adjust if tree-sitter.wasm isn't found automatically
        // locateFile(scriptName: string, scriptDirectory: string) {
        //   console.log("Locating:", scriptName, scriptDirectory);
        //   if (scriptName === 'tree-sitter.wasm') {
        //      return '/wasm/tree-sitter.wasm';
        //   }
        //   return scriptName;
        // }
      });
    })();
  }
  await parserInitialized;
}

/**
 * Loads a Tree-sitter language grammar from its WASM file.
 * Caches loaded languages to avoid redundant fetches.
 *
 * @param languageName - The base name of the language (e.g., 'javascript', 'tsx').
 * @returns The loaded language object.
 * @throws If the language WASM file cannot be loaded.
 */
async function loadLanguage(languageName: string): Promise<import('web-tree-sitter').Language> {
  if (languageCache.has(languageName)) {
    return languageCache.get(languageName)!;
  }

  await initializeParser(); // Ensure parser core and dynamic imports are ready

  if (!Language) {
    throw new Error('Tree-sitter Language module not loaded dynamically.');
  }

  const wasmPath = `/wasm/tree-sitter/tree-sitter-${languageName}.wasm`;
  console.log(`Loading language ${languageName} from ${wasmPath}`);

  try {
    const language = await Language.load(wasmPath);
    languageCache.set(languageName, language);
    console.log(`Language ${languageName} loaded successfully.`);
    return language;
  } catch (error) {
    console.error(`Failed to load language '${languageName}' from ${wasmPath}:`, error);
    throw new Error(`Failed to load language '${languageName}'`);
  }
}

/**
 * Creates a Tree-sitter parser instance configured for a specific file extension.
 *
 * @param fileExtension - The file extension (e.g., '.js', '.tsx').
 * @returns A configured Parser instance or null if the extension is unsupported.
 */
export async function getParser(fileExtension: string): Promise<import('web-tree-sitter').Parser | null> {
  await initializeParser(); // Ensure parser core and dynamic imports are ready

  if (!Parser) {
      throw new Error('Tree-sitter Parser module not loaded dynamically.');
  }

  let languageName: string | null = null;
  switch (fileExtension) {
    case '.js':
    case '.jsx':
      languageName = 'javascript';
      break;
    case '.ts':
    case '.tsx':
      languageName = 'tsx'; // TSX grammar handles both TS and TSX
      break;
    default:
      console.warn(`Unsupported file extension for AST parsing: ${fileExtension}`);
      return null;
  }

  try {
    const language = await loadLanguage(languageName);
    const parser = new Parser();
    parser.setLanguage(language);
    return parser;
  } catch (error) {
    console.error(`Error getting parser for extension ${fileExtension}:`, error);
    return null;
  }
}

/**
 * Parses source code into a Tree-sitter AST.
 *
 * @param sourceCode - The source code string to parse.
 * @param fileExtension - The file extension to determine the language.
 * @returns The parsed AST Tree, or null if parsing fails or extension is unsupported.
 */
export async function parseSource(sourceCode: string, fileExtension: string): Promise<import('web-tree-sitter').Tree | null> {
    const parser = await getParser(fileExtension);
    if (!parser) {
        return null;
    }
    try {
        const tree = parser.parse(sourceCode);
        return tree;
    } catch (error) {
        console.error(`Error parsing file with extension ${fileExtension}:`, error);
        return null;
    } finally {
        // parser.delete(); // Explicit deletion might be needed depending on usage
    }
} 