import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Bold, 
  Italic, 
  Code, 
  List, 
  ListOrdered, 
  Quote, 
  Heading1, 
  Heading2,
  Undo,
  Redo
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Helper to place caret at end
  const placeCaretAtEnd = (el: HTMLElement) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  // Only sync external value when not actively typing to avoid caret jump
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isFocused) return; // do not overwrite while user is typing

    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
      // Keep caret at end for better UX
      placeCaretAtEnd(el);
    }
  }, [value, isFocused]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateValue();
  };

  const updateValue = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      execCommand('insertLineBreak');
    }
  };

  const formatCode = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const codeElement = document.createElement('code');
      codeElement.style.backgroundColor = '#f1f5f9';
      codeElement.style.padding = '2px 4px';
      codeElement.style.borderRadius = '4px';
      codeElement.style.fontFamily = 'monospace';
      
      if (range.toString()) {
        codeElement.appendChild(range.extractContents());
        range.insertNode(codeElement);
      } else {
        codeElement.textContent = 'code';
        range.insertNode(codeElement);
      }
      updateValue();
    }
  };

  const formatList = (ordered: boolean = false) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const listElement = document.createElement(ordered ? 'ol' : 'ul');
      const listItem = document.createElement('li');
      
      if (range.toString()) {
        listItem.appendChild(range.extractContents());
      } else {
        listItem.textContent = 'List item';
      }
      
      listElement.appendChild(listItem);
      range.insertNode(listElement);
      updateValue();
    }
  };

  const formatHeading = (level: number) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const headingElement = document.createElement(`h${level}`);
      headingElement.style.fontWeight = 'bold';
      headingElement.style.marginTop = '1rem';
      headingElement.style.marginBottom = '0.5rem';
      
      if (level === 1) {
        headingElement.style.fontSize = '1.5rem';
      } else {
        headingElement.style.fontSize = '1.25rem';
      }
      
      if (range.toString()) {
        headingElement.appendChild(range.extractContents());
      } else {
        headingElement.textContent = `Heading ${level}`;
      }
      
      range.insertNode(headingElement);
      updateValue();
    }
  };

  const formatQuote = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const quoteElement = document.createElement('blockquote');
      quoteElement.style.borderLeft = '4px solid #e2e8f0';
      quoteElement.style.paddingLeft = '1rem';
      quoteElement.style.margin = '1rem 0';
      quoteElement.style.fontStyle = 'italic';
      
      if (range.toString()) {
        quoteElement.appendChild(range.extractContents());
      } else {
        quoteElement.textContent = 'Quote';
      }
      
      range.insertNode(quoteElement);
      updateValue();
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('bold')}
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('italic')}
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatCode}
            className="h-8 w-8 p-0"
          >
            <Code className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatHeading(1)}
            className="h-8 px-2 text-xs"
          >
            H1
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatHeading(2)}
            className="h-8 px-2 text-xs"
          >
            H2
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatList(false)}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatList(true)}
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={formatQuote}
            className="h-8 w-8 p-0"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('undo')}
            className="h-8 w-8 p-0"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('redo')}
            className="h-8 w-8 p-0"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          className={`min-h-[200px] p-4 outline-none ${
            isFocused ? 'ring-2 ring-primary/20' : ''
          }`}
          onInput={updateValue}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          data-placeholder={placeholder}
          style={{ minHeight: '200px' }}
        />
      </CardContent>
    </Card>
  );
} 