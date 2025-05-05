import React, { useState, useEffect, useCallback } from 'react';
import * as t from '@babel/types';
import type { Node } from '@babel/types';
import { extractPropsFromNode, ExtractedPropInfo, PropValue } from '@/lib/ast/propExtraction';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InspectorProps {
  selectedNode: Node | null;
  // Add an onChange prop later when connecting to AST patching
  // onChangeProp: (propName: string, newValue: PropValue) => void;
}

export function Inspector({ selectedNode }: InspectorProps) {
  const [props, setProps] = useState<ExtractedPropInfo[]>([]);
  // Local state to hold edits before they are saved
  const [editedValues, setEditedValues] = useState<Record<string, PropValue>>({});

  useEffect(() => {
    const extracted = extractPropsFromNode(selectedNode);
    setProps(extracted);
    // Reset edited values when selection changes
    const initialEdits: Record<string, PropValue> = {};
    extracted.forEach(prop => {
        initialEdits[prop.name] = prop.value;
    });
    setEditedValues(initialEdits);
  }, [selectedNode]);

  // Handler to update local state. Later this will trigger AST patch
  const handleInputChange = useCallback((propName: string, value: PropValue) => {
    setEditedValues(prev => ({ ...prev, [propName]: value }));
    // TODO: Call onChangeProp here later
    // console.log('Prop changed (local state):', propName, value);
  }, []);

  const renderPropControl = (prop: ExtractedPropInfo) => {
    const { name, inferredType, node } = prop;
    const currentValue = editedValues[name] ?? prop.value; // Use edited value if available
    const inputId = `prop-${name}`;

    // Disable editing for spread attributes for now
    const isDisabled = t.isJSXSpreadAttribute(node);

    switch (inferredType) {
      case 'string':
        return (
          <Input
            id={inputId}
            type="text"
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(e) => handleInputChange(name, e.target.value)}
            disabled={isDisabled}
            className="nodrag"
          />
        );
      case 'number':
        return (
          <Input
            id={inputId}
            type="number"
            value={typeof currentValue === 'number' ? currentValue : ''}
            onChange={(e) => handleInputChange(name, parseFloat(e.target.value) || 0)}
            disabled={isDisabled}
            className="nodrag"
          />
        );
      case 'boolean':
        return (
          <div className="flex items-center space-x-2 h-10">
            <Checkbox
              id={inputId}
              checked={!!currentValue}
              onCheckedChange={(checked) => handleInputChange(name, !!checked)}
              disabled={isDisabled}
            />
            <Label htmlFor={inputId} className="text-sm">
              {currentValue ? 'true' : 'false'}
            </Label>
           </div>
        );
      case 'color':
        return (
          <Input
            id={inputId}
            type="color"
            value={typeof currentValue === 'string' ? currentValue : '#000000'}
            onChange={(e) => handleInputChange(name, e.target.value)}
            disabled={isDisabled}
            className="nodrag h-8 w-10 p-1"
          />
        );
       case 'unit': // Treat as text input for now
         return (
           <Input
             id={inputId}
             type="text"
             value={typeof currentValue === 'string' ? currentValue : ''}
             onChange={(e) => handleInputChange(name, e.target.value)}
             disabled={isDisabled}
             className="nodrag"
           />
         );
      case 'code':
        return (
          <Input
            id={inputId}
            type="text"
            readOnly
            value={typeof currentValue === 'object' && currentValue !== null && 'code' in currentValue ? currentValue.code : 'Invalid Code'}
            className="font-mono text-xs nodrag bg-muted"
            disabled={isDisabled}
            title={typeof currentValue === 'object' && currentValue !== null && 'code' in currentValue ? currentValue.code : 'Invalid Code'}
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
        {/* Maybe add node type here later: e.g., selectedNode.type */}
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="space-y-4">
          {props.length === 0 && (
            <p className="text-sm text-muted-foreground">No editable props found for this element.</p>
          )}
          {props.map((prop) => (
            <div key={prop.name} className="grid grid-cols-2 items-center gap-3">
              <Label htmlFor={`prop-${prop.name}`} className="text-sm font-medium truncate" title={prop.name}>{prop.name}</Label>
              <div className="nodrag"> {/* Prevent dragging on the control wrapper */} 
                 {renderPropControl(prop)}
              </div>
            </div>
          ))}
        </CardContent>
      </ScrollArea>
    </Card>
  );
} 