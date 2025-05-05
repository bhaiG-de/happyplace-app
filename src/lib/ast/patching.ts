import * as t from '@babel/types';
import { parseExpression } from '@babel/parser';
import type { Node, JSXAttribute, StringLiteral, JSXExpressionContainer } from '@babel/types';

/**
 * Type definition for the value to be applied to a prop.
 * Can be a primitive, or an object representing raw code.
 */
export type PropValue = string | number | boolean | null | undefined | { code: string };

/**
 * Creates the appropriate Babel AST node for a given PropValue.
 */
function createValueNode(value: PropValue): StringLiteral | JSXExpressionContainer | null {
  if (value === undefined) {
    // Undefined typically means remove the prop, handled separately
    return null; 
  }
  if (value === true) {
    // Boolean true is represented by omitting the value
    return null;
  }
  if (value === false) {
    return t.jsxExpressionContainer(t.booleanLiteral(false));
  }
  if (value === null) {
    return t.jsxExpressionContainer(t.nullLiteral());
  }
  if (typeof value === 'string') {
    return t.stringLiteral(value);
  }
  if (typeof value === 'number') {
    return t.jsxExpressionContainer(t.numericLiteral(value));
  }
  if (typeof value === 'object' && value !== null && 'code' in value) {
    try {
      // Parse the code string back into an AST expression
      const expression = parseExpression(value.code, {
        plugins: ['jsx', 'typescript'], // Ensure parser plugins match original parse
        errorRecovery: true,
      });
      return t.jsxExpressionContainer(expression);
    } catch (e) {
      console.error(`Error parsing expression code \'${value.code}\':`, e);
      // Fallback to a string literal indicating error
      return t.stringLiteral(`/* Invalid Code: ${value.code} */`);
    }
  }

  // Should not happen for valid PropValue types
  console.warn('Unhandled PropValue type:', value);
  return t.stringLiteral('/* Unhandled Value */');
}

/**
 * Applies a patch to a specific prop (attribute) of a JSXOpeningElement node.
 * Mutates the provided AST node directly.
 *
 * @param node The AST node to patch (must be JSXOpeningElement).
 * @param propName The name of the prop/attribute to modify.
 * @param newValue The new value for the prop.
 *                 Use `undefined` to remove the prop.
 */
export function applyPropPatch(node: Node | null, propName: string, newValue: PropValue): void {
  if (!node || !t.isJSXOpeningElement(node)) {
    console.error('applyPropPatch: Provided node is not a JSXOpeningElement', node);
    return;
  }

  const attributes = node.attributes;
  const existingAttrIndex = attributes.findIndex(
    (attr) => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === propName
  );

  if (newValue === undefined) {
    // --- Remove the attribute --- 
    if (existingAttrIndex !== -1) {
      attributes.splice(existingAttrIndex, 1);
      console.log(`[AST Patch] Removed prop '${propName}'`);
    }
    return; 
  }

  // --- Add or Update the attribute --- 
  const newValueNode = createValueNode(newValue);

  if (existingAttrIndex !== -1) {
    // --- Update existing attribute --- 
    const existingAttr = attributes[existingAttrIndex] as JSXAttribute; // We know it's JSXAttribute from findIndex
    existingAttr.value = newValueNode;
    console.log(`[AST Patch] Updated prop '${propName}'`);

  } else {
    // --- Add new attribute --- 
    const newAttribute = t.jsxAttribute(
      t.jsxIdentifier(propName),
      newValueNode
    );
    attributes.push(newAttribute);
    console.log(`[AST Patch] Added prop '${propName}'`);
  }
} 