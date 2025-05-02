import { useContext } from 'react';
// Correct the path based on actual file structure
import { AstRegistryContext, AstRegistryContextType } from '../context/AstRegistryContext';

/**
 * Hook to access the AST Registry context.
 *
 * Provides access to the map of parsed ASTs, loading state, errors,
 * and a function to refresh the registry.
 *
 * Must be used within an AstRegistryProvider.
 */
export const useAstRegistry = (): AstRegistryContextType => {
  // The context type includes 'undefined' in the createContext call,
  // but the provider always supplies a value. We check for undefined
  // to ensure it's used correctly within the provider.
  const context = useContext(AstRegistryContext);
  if (context === undefined) {
    throw new Error('useAstRegistry must be used within an AstRegistryProvider');
  }
  return context;
}; 