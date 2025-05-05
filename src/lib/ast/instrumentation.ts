import traverse from "@babel/traverse";
import { nanoid } from 'nanoid';
import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { File, JSXOpeningElement, JSXElement, Node } from '@babel/types';

export type UidToAstNodeMap = Map<string, Node>;

interface InstrumentationResult {
  instrumentedAst: File;
  uidToAstNodeMap: UidToAstNodeMap;
}

/**
 * Traverses the AST, injects data-uid attributes into JSX opening elements,
 * and builds a map from these UIDs to the PARENT JSXElement nodes.
 */
export function instrumentCode(ast: File): InstrumentationResult {
  const uidToAstNodeMap: UidToAstNodeMap = new Map();
  const clonedAst = t.cloneNode(ast, true); // Deep clone to avoid mutating the original AST

  traverse(clonedAst, {
    JSXOpeningElement(path: NodePath<JSXOpeningElement>) {
      // Get the parent JSXElement node
      const parentElementNode = path.parentPath.node as JSXElement; // Assume parent is JSXElement
      if (!t.isJSXElement(parentElementNode)) {
        // Should not happen for valid JSX but good practice to check
        console.warn('Parent of JSXOpeningElement is not JSXElement:', parentElementNode);
        return; 
      }

      const attributes = path.node.attributes;
      const existingAttr = attributes.find(
        (attr): attr is t.JSXAttribute =>
          t.isJSXAttribute(attr) && attr.name.name === 'data-uid'
      );

      if (!existingAttr) {
        const uid = nanoid(10); 
        // Set map value to the PARENT JSXElement
        uidToAstNodeMap.set(uid, parentElementNode); 

        const uidAttribute = t.jsxAttribute(
          t.jsxIdentifier('data-uid'),
          t.stringLiteral(uid)
        );
        // Add attribute to the OpeningElement itself
        attributes.push(uidAttribute);

      } else {
        // If UID already exists, ensure the PARENT node is in the map
        if (existingAttr && t.isStringLiteral(existingAttr.value)) {
          const existingUid = existingAttr.value.value;
          if (!uidToAstNodeMap.has(existingUid)) {
             // Set map value to the PARENT JSXElement
             uidToAstNodeMap.set(existingUid, parentElementNode); 
          }
        }
      }
    },
  });

  return { instrumentedAst: clonedAst, uidToAstNodeMap };
} 