import React, { useState, useEffect, useCallback } from 'react';
import * as t from '@babel/types'; 
import type { Node } from '@babel/types';
import { extractPropsFromNode, ExtractedPropInfo, PropValue } from '@/lib/ast/propExtraction'; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; 
import { Label } from "@/components/ui/label"; 
import { Input } from "@/components/ui/input"; 
import { Textarea } from "@/components/ui/textarea"; 
import { Checkbox } from "@/components/ui/checkbox"; 
import { ScrollArea } from "@/components/ui/scroll-area"; 

interface InspectorProps {
  selectedNode: Node | null;
  // selectedNodeUid?: string | null; // Keep if needed for display, otherwise remove
  // onChangeProp: (propName: string, newValue: PropValue) => void; // Add later
  // TODO: Need a different handler for style object changes
  // onStyleChange: (styleProp: string, newValue: string | number) => void; 
}

export function Inspector({ selectedNode /*, selectedNodeUid */ }: InspectorProps) {
  const [props, setProps] = useState<ExtractedPropInfo[]>([]);
  // Local state to hold edits before they are saved
  const [editedValues, setEditedValues] = useState<Record<string, PropValue>>({});

  useEffect(() => {
    const extracted = extractPropsFromNode(selectedNode);
    console.log('[Inspector] Extracted props for selected node:', extracted);
    setProps(extracted);
    // Reset edited values when selection changes
    const initialEdits: Record<string, PropValue> = {};
    extracted.forEach(prop => {
        initialEdits[prop.name] = prop.value;
    });
    setEditedValues(initialEdits);
  }, [selectedNode]);

  // Handler for simple prop value changes
  const handleValueChange = useCallback((propName: string, value: PropValue) => {
    setEditedValues(prev => ({ ...prev, [propName]: value }));
    // TODO: Call onChangeProp(propName, value) later 
  }, []);

  // Handler specifically for changes within the inline style object
  const handleStyleChange = useCallback((stylePropName: string, stylePropValue: string | number) => {
    setEditedValues(prev => {
      const currentStyle = prev['style'];
      if (typeof currentStyle === 'object' && currentStyle !== null && !('code' in currentStyle)) {
        return {
          ...prev,
          style: {
            ...currentStyle,
            [stylePropName]: stylePropValue,
          }
        };
      } 
      // If style wasn't an object, something is wrong, return previous state
      // Or potentially initialize style: { [stylePropName]: stylePropValue } ?
      console.warn('Cannot update style, current style prop is not a valid object:', currentStyle);
      return prev; 
    });
    // TODO: Call onStyleChange(stylePropName, stylePropValue) later
    // console.log('Style changed:', stylePropName, stylePropValue);
  }, []);

  const renderPropControl = (prop: ExtractedPropInfo) => {
    const { name, inferredType, node } = prop;
    const currentValue = editedValues[name] ?? prop.value;
    const inputIdBase = `prop-${name}`;
    const isDisabled = t.isJSXSpreadAttribute(node); 

    switch (inferredType) {
      // --- Text Content / String --- 
      case 'string':
        if (name === 'textContent') {
          return (
            <Textarea
              id={inputIdBase}
              value={typeof currentValue === 'string' ? currentValue : ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleValueChange(name, e.target.value)}
              disabled={isDisabled}
              className="nodrag h-20"
              rows={3}
            />
          );
        } else { // Default string input (e.g., className)
          return (
            <Input
              id={inputIdBase}
              type="text"
              value={typeof currentValue === 'string' ? currentValue : ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleValueChange(name, e.target.value)}
              disabled={isDisabled}
              className="nodrag"
              placeholder={name === 'className' ? "e.g., text-red-500 p-4" : undefined}
            />
          );
        }
      
      // --- Inline Style Object --- 
      case 'inlineStyleObject':
          if (typeof currentValue !== 'object' || currentValue === null || 'code' in currentValue) {
            return <span className="text-xs text-red-500">Invalid style data</span>;
          }
          return (
            <div className="space-y-2 rounded-md border border-input p-2">
              {Object.entries(currentValue).map(([styleKey, styleValue]) => {
                const styleInputId = `${inputIdBase}-${styleKey}`;
                const isCode = typeof styleValue === 'object' && styleValue !== null && 'code' in styleValue;
                const styleValueString = isCode ? styleValue.code : String(styleValue ?? '');
                
                return (
                   <div key={styleKey} className="grid grid-cols-3 items-center gap-1">
                     <Label htmlFor={styleInputId} className="text-xs truncate col-span-1" title={styleKey}>{styleKey}</Label>
                     <Input
                       id={styleInputId}
                       type="text"
                       value={styleValueString}
                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                           if (!isCode) {
                             handleStyleChange(styleKey, e.target.value);
                           } 
                       }}
                       disabled={isCode}
                       className={`nodrag text-xs h-7 col-span-2 ${isCode ? 'font-mono bg-muted' : ''}`}
                       title={styleValueString}
                     />
                   </div>
                );
              })}
              {Object.keys(currentValue).length === 0 && (
                 <p className="text-xs text-muted-foreground italic text-center">Empty style object</p>
              )}
            </div>
          );

      // --- Other Types (Number, Boolean, Color, Unit, Code, Null, Undefined, Unknown) ---
      case 'number':
        return (
          <Input id={inputIdBase} type="number" value={typeof currentValue === 'number' ? currentValue : ''}
                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleValueChange(name, parseFloat(e.target.value) || 0)} disabled={isDisabled} className="nodrag" />
        );
      case 'boolean':
        return (
          <div className="flex items-center space-x-2 h-10">
            <Checkbox id={inputIdBase} checked={!!currentValue} onCheckedChange={(checked) => handleValueChange(name, !!checked)} disabled={isDisabled} />
            <Label htmlFor={inputIdBase} className="text-sm">{currentValue ? 'true' : 'false'}</Label>
          </div>
        );
      case 'color':
        return (
           <Input id={inputIdBase} type="color" value={typeof currentValue === 'string' ? currentValue : '#000000'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleValueChange(name, e.target.value)} disabled={isDisabled} className="nodrag h-8 w-10 p-1" />
        );
       case 'unit': // Treat as text input for now
         return (
           <Input
             id={inputIdBase}
             type="text"
             value={typeof currentValue === 'string' ? currentValue : ''}
             onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleValueChange(name, e.target.value)}
             disabled={isDisabled}
             className="nodrag"
           />
         );
      case 'code':
        const derivedCodeValue = typeof currentValue === 'object' && currentValue !== null && 'code' in currentValue ? currentValue.code : 'Invalid Code';
        // Ensure value passed to Input props are strings
        const valueAsString = String(derivedCodeValue); 
        return (
          <Input 
            id={inputIdBase} 
            type="text" 
            readOnly 
            value={valueAsString} // Use derived string value
            disabled={isDisabled} 
            className="font-mono text-xs nodrag bg-muted" 
            title={valueAsString} // Use derived string value
          />
        );
      case 'null':
        return <span className="text-sm text-muted-foreground italic h-10 flex items-center">null</span>;
      case 'undefined':
        return <span className="text-sm text-muted-foreground italic h-10 flex items-center">undefined</span>;
      case 'unknown':
      default:
        return <span className="text-sm text-muted-foreground italic h-10 flex items-center">Unknown Type</span>;
    }
  };

  if (!selectedNode) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Inspector</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select an element in the code to see its props.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Inspector</CardTitle>
        {/* Maybe display UID or node type here if needed */ }
        {/* <p className="text-xs text-muted-foreground truncate">UID: {selectedNodeUid || 'N/A'}</p> */}
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="space-y-4">
          {props.length === 0 && (
            <p className="text-sm text-muted-foreground">No editable props found for this element.</p>
          )}
          {props.map((prop) => (
            // Use Card-like sections for Style Object?
            prop.inferredType === 'inlineStyleObject' ? (
                <div key={prop.name}>
                  <Label className="text-sm font-medium mb-1 block">{prop.name}:</Label>
                  {renderPropControl(prop)}
                </div>
            ) : (
              <div key={prop.name} className="grid grid-cols-2 items-center gap-3">
                <Label htmlFor={`prop-${prop.name}`} className="text-sm font-medium truncate" title={prop.name}>{prop.name}</Label>
                <div className="nodrag"> {/* Prevent dragging on the control wrapper */} 
                   {renderPropControl(prop)}
                </div>
              </div>
            )
          ))}
        </CardContent>
      </ScrollArea>
    </Card>
  );
} 