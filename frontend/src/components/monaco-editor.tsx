import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
  onKeyStroke?: (key: string) => void;
}

export function MonacoEditor({ 
  value, 
  onChange, 
  height = "400px", 
  readOnly = false,
  onKeyStroke
}: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [monacoLoaded, setMonacoLoaded] = useState(false);
  const { toast } = useToast();
  const editorInstanceRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const onKeyStrokeRef = useRef(onKeyStroke);

  // Update refs when props change
  useEffect(() => {
    onChangeRef.current = onChange;
    onKeyStrokeRef.current = onKeyStroke;
  }, [onChange, onKeyStroke]);



  // Core blocker used by multiple handlers
  const blockAction = useCallback((e: Event, what: string) => {
    e.preventDefault();
    e.stopPropagation();
    toast({
      title: `${what} Blocked`,
      description: `${what} operation is disabled for integrity purposes`,
      variant: 'destructive',
    });
    return false as unknown as void;
  }, [toast]);

  useEffect(() => {
    if (!editorRef.current) return;

    const node = editorRef.current;

    // ******************************************* Copy paste ************************************************

    // Capture-phase listeners on the editor container
    const onPaste = (e: Event) => blockAction(e, 'Paste');
    const onCopy = (e: Event) => blockAction(e, 'Copy');
    const onCut = (e: Event) => blockAction(e, 'Cut');
    const onDrop = (e: Event) => blockAction(e, 'Drop');
    const onBeforeInput = (e: Event) => {
      const be = e as unknown as InputEvent;
      // Block paste-like inputs at the DOM level
      if ((be as any).inputType && String((be as any).inputType).startsWith('insertFromPaste')) {
        blockAction(e, 'Paste');
      }
      if ((be as any).inputType && String((be as any).inputType).startsWith('insertFromDrop')) {
        blockAction(e, 'Drop');
      }
    };

    node.addEventListener('paste', onPaste, true);
    node.addEventListener('copy', onCopy, true);
    node.addEventListener('cut', onCut, true);
    node.addEventListener('drop', onDrop, true);
    node.addEventListener('beforeinput', onBeforeInput as any, true);

    // Global capture listeners (defense in depth)
    document.addEventListener('paste', onPaste, true);
    document.addEventListener('copy', onCopy, true);
    document.addEventListener('cut', onCut, true);
    document.addEventListener('drop', onDrop, true);
    document.addEventListener('beforeinput', onBeforeInput as any, true);

    // Disable context menu on editor surface
    const onContext = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); };
    node.addEventListener('contextmenu', onContext, true);

    // ******************************************* Copy paste ************************************************

    return () => {


      // ******************************************* Copy paste ************************************************

      node.removeEventListener('paste', onPaste, true);
      node.removeEventListener('copy', onCopy, true);
      node.removeEventListener('cut', onCut, true);
      node.removeEventListener('drop', onDrop, true);
      node.removeEventListener('beforeinput', onBeforeInput as any, true);

      document.removeEventListener('paste', onPaste, true);
      document.removeEventListener('copy', onCopy, true);
      document.removeEventListener('cut', onCut, true);
      document.removeEventListener('drop', onDrop, true);
      document.removeEventListener('beforeinput', onBeforeInput as any, true);

      node.removeEventListener('contextmenu', onContext, true);

      // ******************************************* Copy paste ************************************************
    };
    
  }, [blockAction]);

  useEffect(() => {
    if (editorRef.current) {
      const loadMonaco = async () => {
        try {
          if ((window as any).monaco) {
            createEditor();
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/monaco-editor@0.44.0/min/vs/loader.js';
          document.head.appendChild(script);
          script.onload = () => {
            (window as any).require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@0.44.0/min/vs' } });
            (window as any).require(['vs/editor/editor.main'], function() { createEditor(); });
          };
          script.onerror = () => { setMonacoLoaded(false); };
        } catch (e) {
          setMonacoLoaded(false);
        }
      };

      const createEditor = () => {
        if (!editorRef.current) return;
        try {
          const monaco = (window as any).monaco;
          
          const editor = monaco.editor.create(editorRef.current, {
            value,
            language: 'java',
            theme: 'vs-dark',
            fontSize: 14,
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            readOnly,
            contextmenu: false,
            copyWithSyntaxHighlighting: false,
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnEnter: 'off',
            wordWrap: 'on',
            folding: true,
            renderLineHighlight: 'all',
          });

          // Store editor instance
          editorInstanceRef.current = editor;

          // Content change propagation
          editor.onDidChangeModelContent(() => {
            const newValue = editor.getValue();
            if (onChangeRef.current) {
              onChangeRef.current(newValue);
            }
          });

          // Key combinations blocking
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {});
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {});
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => {});
          editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Insert, () => {});
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA, () => {});

          // Key stroke tracking
          editor.onKeyDown((e: any) => {
            if (onKeyStrokeRef.current) {
              onKeyStrokeRef.current(e.browserEvent.key);
            }
            // ******************************************* Copy paste ************************************************

            const isPasteCombo = (e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyV;
            const isShiftInsert = e.shiftKey && e.keyCode === monaco.KeyCode.Insert;
            if (isPasteCombo || isShiftInsert) { e.preventDefault(); e.stopPropagation(); toast({ title: 'Paste Blocked', description: 'Paste operation is disabled for integrity purposes', variant: 'destructive' }); }
            const isCopyCombo = (e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyC;
            const isCutCombo = (e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyX;
            if (isCopyCombo || isCutCombo) { e.preventDefault(); e.stopPropagation(); toast({ title: (isCopyCombo?'Copy':'Cut')+' Blocked', description: 'Operation is disabled.', variant: 'destructive' }); }

            // ******************************************* Copy paste ************************************************

          });

          // DOM-level blocking also on the Monaco container
          const container = editorRef.current!;

          // ******************************************* Copy paste ************************************************

          const block = (ev: Event) => blockAction(ev, (ev.type.charAt(0).toUpperCase()+ev.type.slice(1)));
          container.addEventListener('paste', block, true);
          container.addEventListener('copy', block, true);
          container.addEventListener('cut', block, true);
          container.addEventListener('drop', block, true);

          // ******************************************* Copy paste ************************************************

          (editorRef.current as any)._editor = editor;
          setMonacoLoaded(true);

          // Hide fallback textarea if present
          const textarea = editorRef.current.querySelector('textarea');
          if (textarea) (textarea as HTMLTextAreaElement).style.display = 'none';
        } catch (e) {
          setMonacoLoaded(false);
        }
      };

      loadMonaco();
    }

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose();
        editorInstanceRef.current = null;
      }
      if (editorRef.current && (editorRef.current as any)._editor) {
        (editorRef.current as any)._editor.dispose();
      }
    };
  }, []); // Empty dependency array - only run once

  // Handle value changes without recreating editor
  useEffect(() => {
    if (editorInstanceRef.current) {
      const editor = editorInstanceRef.current;
      if (editor.getValue() !== value) {
        editor.setValue(value);
      }
    } else if (editorRef.current && (editorRef.current as any)._editor) {
      const editor = (editorRef.current as any)._editor;
      if (editor.getValue() !== value) {
        editor.setValue(value);
      }
    } else if (editorRef.current) {
      const textarea = editorRef.current.querySelector('textarea');
      if (textarea && (textarea as HTMLTextAreaElement).value !== value) {
        (textarea as HTMLTextAreaElement).value = value;
      }
    }
  }, [value]);

  // Handle readOnly changes
  useEffect(() => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.updateOptions({ readOnly });
    } else if (editorRef.current && (editorRef.current as any)._editor) {
      (editorRef.current as any)._editor.updateOptions({ readOnly });
    }
  }, [readOnly]);

  return (
    <div 
      ref={editorRef} 
      style={{ height }}
      className="border rounded overflow-hidden"
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {/* Fallback textarea (also paste/copy/cut/drop protected) */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full p-4 font-mono text-sm bg-gray-900 text-gray-100 border-0 outline-none resize-none"
        style={{ height }}
        placeholder="Write your Java code here..."
        readOnly={readOnly}
        onKeyDown={(e) => {
          if (onKeyStroke) onKeyStroke(e.key);

          // ******************************************* Copy paste ************************************************

          const isPasteCombo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v';
          const isShiftInsert = e.shiftKey && e.key === 'Insert';
          const isCopyCombo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c';
          const isCutCombo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x';
          if (isPasteCombo || isShiftInsert) { e.preventDefault(); toast({ title: 'Paste Blocked', description: 'Paste operation is disabled for integrity purposes', variant: 'destructive' }); }
          if (isCopyCombo || isCutCombo) { e.preventDefault(); toast({ title: (isCopyCombo?'Copy':'Cut')+' Blocked', description: 'Operation is disabled', variant: 'destructive' }); }

          // ******************************************* Copy paste ************************************************

        }}

        // ******************************************* Copy paste ************************************************
        
        onPaste={(e) => { 
          e.preventDefault(); 
          toast({ title: 'Paste Blocked', description: 'Paste operation is disabled for integrity purposes', variant: 'destructive' }); 
        }}
        onCopy={(e) => { 
          e.preventDefault(); 
          toast({ title: 'Copy Blocked', description: 'Copy operation is disabled', variant: 'destructive' }); 
        }}
        onCut={(e) => { 
          e.preventDefault(); 
          toast({ title: 'Cut Blocked', description: 'Cut operation is disabled', variant: 'destructive' }); 
        }}
        onDrop={(e) => { 
          e.preventDefault(); 
          toast({ title: 'Drop Blocked', description: 'Drag and drop is disabled', variant: 'destructive' }); 
        }}
      />

      {/* // ******************************************* Copy paste ************************************************ */}

    </div>
  );
}
