import React, { useState, useRef, useEffect } from 'react';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter content...',
  className = ''
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const handleFocus = () => {
    setIsToolbarVisible(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Keep toolbar visible if clicking on toolbar buttons
    if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setTimeout(() => setIsToolbarVisible(false), 100);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertChemicalFormula = () => {
    const formula = prompt('Enter chemical formula (e.g., H₂SO₄):');
    if (formula) {
      execCommand('insertHTML', `<span class="chemical-formula">${formula}</span>`);
    }
  };

  const insertEquation = () => {
    const equation = prompt('Enter chemical equation (e.g., 2H₂ + O₂ → 2H₂O):');
    if (equation) {
      execCommand('insertHTML', `<div class="chemical-equation">${equation}</div>`);
    }
  };

  const insertSubscript = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      execCommand('subscript');
    } else {
      const text = prompt('Enter subscript text:');
      if (text) {
        execCommand('insertHTML', `<sub>${text}</sub>`);
      }
    }
  };

  const insertSuperscript = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      execCommand('superscript');
    } else {
      const text = prompt('Enter superscript text:');
      if (text) {
        execCommand('insertHTML', `<sup>${text}</sup>`);
      }
    }
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      {isToolbarVisible && (
        <div className="editor-toolbar">
          <div className="toolbar-group">
            <button
              type="button"
              onClick={() => execCommand('bold')}
              className="toolbar-button"
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => execCommand('italic')}
              className="toolbar-button"
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onClick={() => execCommand('underline')}
              className="toolbar-button"
              title="Underline"
            >
              <u>U</u>
            </button>
          </div>

          <div className="toolbar-group">
            <button
              type="button"
              onClick={insertSubscript}
              className="toolbar-button"
              title="Subscript"
            >
              X<sub>2</sub>
            </button>
            <button
              type="button"
              onClick={insertSuperscript}
              className="toolbar-button"
              title="Superscript"
            >
              X<sup>2</sup>
            </button>
          </div>

          <div className="toolbar-group">
            <button
              type="button"
              onClick={insertChemicalFormula}
              className="toolbar-button"
              title="Insert Chemical Formula"
            >
              H₂O
            </button>
            <button
              type="button"
              onClick={insertEquation}
              className="toolbar-button"
              title="Insert Chemical Equation"
            >
              A + B → C
            </button>
          </div>

          <div className="toolbar-group">
            <button
              type="button"
              onClick={() => execCommand('insertUnorderedList')}
              className="toolbar-button"
              title="Bullet List"
            >
              • List
            </button>
            <button
              type="button"
              onClick={() => execCommand('insertOrderedList')}
              className="toolbar-button"
              title="Numbered List"
            >
              1. List
            </button>
          </div>

          <div className="toolbar-group">
            <select
              onChange={(e) => execCommand('formatBlock', e.target.value)}
              className="toolbar-select"
              defaultValue=""
            >
              <option value="">Format</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
              <option value="p">Paragraph</option>
            </select>
          </div>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="editor-content"
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};