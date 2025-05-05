import * as t from '@babel/types';
import type { Node, JSXAttribute, JSXSpreadAttribute } from '@babel/types';
import generate from '@babel/generator';

// Type definition for the value extracted or to be applied.
export type PropValue = string | number | boolean | null | undefined | { code: string } | Record<string, string | number | { code: string }>; // Added Record for inline styles

// Inferred type for UI rendering
export type PropType = 'string' | 'number' | 'boolean' | 'color' | 'unit' | 'code' | 'null' | 'undefined' | 'inlineStyleObject' | 'unknown'; // Added inlineStyleObject

// Interface for the structured prop information
export interface ExtractedPropInfo {
  name: string;
  value: PropValue;
  inferredType: PropType;
  node: JSXAttribute | JSXSpreadAttribute | Node; // Allow Node for textContent ref
}

// Helper to infer type from value
function inferTypeFromValue(value: PropValue, propName?: string): PropType { // Added optional propName
  if (propName === 'style' && typeof value === 'object' && value !== null && !('code' in value)) {
      return 'inlineStyleObject';
  }
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    if (propName === 'className') return 'string'; // Keep className as string for now
    if (/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value)) return 'color';
    if (/^rgba?\(/.test(value)) return 'color';
    if (/^hsla?\(/.test(value)) return 'color';
    if (/(\d*\.?\d+)(px|rem|em|%|vh|vw|s|ms)$/.test(value)) return 'unit';
    return 'string';
  }
  if (typeof value === 'object' && value !== null && 'code' in value) {
      return 'code';
  }
  return 'unknown';
}

// Special prop name for children content
const CHILD_CONTENT_PROP_NAME = 'textContent';

/**
 * Extracts attributes (including parsing inline style objects) and simple text content 
 * from a JSXElement AST node.
 */
export function extractPropsFromNode(node: Node | null): ExtractedPropInfo[] {
  if (!node || !t.isJSXElement(node)) { return []; }

  const extractedProps: ExtractedPropInfo[] = [];
  const openingElement = node.openingElement;

  // 1. Extract Attributes
  openingElement.attributes.forEach((attr) => {
    let name: string | undefined;
    let value: PropValue | undefined;
    const attributeNodeForRef: JSXAttribute | JSXSpreadAttribute = attr;

    if (t.isJSXAttribute(attr)) {
        if (t.isJSXIdentifier(attr.name)) {
          name = attr.name.name;
          const valueNode = attr.value;

          // --- Special Handling for 'style' prop --- 
          if (name === 'style' && t.isJSXExpressionContainer(valueNode) && t.isObjectExpression(valueNode.expression)) {
              const styleObject: Record<string, string | number | { code: string }> = {};
              valueNode.expression.properties.forEach(prop => {
                  if (t.isObjectProperty(prop) && (t.isIdentifier(prop.key) || t.isStringLiteral(prop.key))) {
                      const styleKey = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value;
                      if (t.isStringLiteral(prop.value)) {
                          styleObject[styleKey] = prop.value.value;
                      } else if (t.isNumericLiteral(prop.value)) {
                          styleObject[styleKey] = prop.value.value;
                      } else { // Handle other value types as code strings
                          try { styleObject[styleKey] = { code: generate(prop.value, { concise: true }).code }; }
                          catch { styleObject[styleKey] = { code: '/* Error */' }; }
                      }
                  } else if (t.isSpreadElement(prop)) { // Handle spread within style object
                       try { 
                          const spreadCode = generate(prop.argument, { concise: true }).code;
                          styleObject[`...${spreadCode.substring(0,10)}`] = { code: `...${spreadCode}` };
                       } catch { styleObject['...spreadError'] = { code: '/* Error */' }; }
                  }
              });
              value = styleObject; // Assign the parsed object as the value
          }
          // --- Default Handling for other props --- 
          else if (valueNode === null) value = true;
          else if (t.isStringLiteral(valueNode)) value = valueNode.value;
          else if (t.isJSXExpressionContainer(valueNode)) {
            const expression = valueNode.expression;
            if (t.isStringLiteral(expression)) value = expression.value;
            else if (t.isNumericLiteral(expression)) value = expression.value;
            else if (t.isBooleanLiteral(expression)) value = expression.value;
            else if (t.isNullLiteral(expression)) value = null;
            else if (t.isIdentifier(expression) && expression.name === 'undefined') value = undefined;
            else if (!t.isJSXEmptyExpression(expression)) {
              try { value = { code: generate(expression, { concise: true }).code }; }
              catch (genError: unknown) { 
                console.error(`Error generating code for prop '${name}':`, genError);
                value = { code: '/* Error generating value */' }; 
              }
            }
          }
        } else { /* JSXNamespacedName */ 
             try { name = generate(attr.name).code; value = { code: '/* Namespaced Prop */' }; }
             catch { name = '/* Error: Namespaced Name */'; } 
        }
      } else if (t.isJSXSpreadAttribute(attr)) { /* Spread attribute */ 
        try {
          const { code } = generate(attr.argument, { concise: true });
          name = `...${code.substring(0, 15)}${code.length > 15 ? '...': ''}`;
          value = { code: `value: ${code}` };
        } catch (genError: unknown) {
          console.warn('Error generating code for spread attribute:', genError);
          name = '.../* Error */'; value = { code: 'spread' };
        } 
      }

    if (name !== undefined) {
      extractedProps.push({
        name,
        value: value,
        inferredType: inferTypeFromValue(value, name),
        node: attributeNodeForRef 
      });
    }
  });

  // 2. Extract Simple Text Content from Children
  const children = node.children.filter(child => !t.isJSXEmptyExpression(child)); 
  // ... (Existing children extraction logic - unchanged) ...
    if (children.length === 1) {
        const child = children[0];
        let childValue: PropValue | undefined;
        let childNodeForRef: Node = child; 
    
        if (t.isJSXText(child)) {
          const text = child.value.trim(); 
          if (text) { childValue = text; } 
        } else if (t.isJSXExpressionContainer(child)) {
          const expression = child.expression;
          if (t.isStringLiteral(expression)) childValue = expression.value;
          else if (t.isNumericLiteral(expression)) childValue = expression.value;
          else if (t.isBooleanLiteral(expression)) childValue = expression.value;
          else if (t.isNullLiteral(expression)) childValue = null;
          else if (t.isIdentifier(expression) && expression.name === 'undefined') childValue = undefined;
          else {
             try { childValue = { code: generate(expression, { concise: true }).code }; }
             catch (genError: unknown) { 
               console.error(`Error generating code for child expression:`, genError);
               childValue = { code: '/* Error generating child code */' }; 
             }
          }
          childNodeForRef = expression; 
        }

        if (childValue !== undefined) {
            extractedProps.push({
                name: CHILD_CONTENT_PROP_NAME,
                value: childValue,
                inferredType: inferTypeFromValue(childValue, CHILD_CONTENT_PROP_NAME), // Pass name 
                node: childNodeForRef // Keep Node type here
            });
        }
    
      } else if (children.length > 1) {
           try {
               const childrenCode = node.children.map(c => generate(c, { concise: false }).code).join('\n');
               extractedProps.push({
                    name: CHILD_CONTENT_PROP_NAME,
                    value: { code: childrenCode },
                    inferredType: 'code',
                    node: node.children[0] // Placeholder ref
               });
           } catch (genError: unknown) { 
               console.error(`Error generating code for multiple children:`, genError);
           }
      }

  return extractedProps;
}