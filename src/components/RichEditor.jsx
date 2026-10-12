import { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link2, AlignLeft, AlignCenter, ChevronDown, Braces, Eraser } from 'lucide-react';
import { Menu, MenuItem } from './ui';
import { BASE_VARS } from '../lib/vars';

// Lightweight contentEditable editor. document.execCommand is deprecated but works in every
// browser and is plenty for bold/italic/lists/links without pulling in an editor framework.
const BLOCKS = [['Normal', 'p'], ['Heading', 'h2'], ['Quote', 'blockquote']];

export default function RichEditor({ value, onChange, extraVars = [], minHeight = 220 }) {
  const ref = useRef(null);
  const last = useRef(null);
  const range = useRef(null);

  // Sync external changes (loading a draft/template) without clobbering the caret while typing
  useEffect(() => {
    if (value !== last.current && ref.current) {
      ref.current.innerHTML = value;
      last.current = value;
    }
  }, [value]);

  const emit = () => {
    last.current = ref.current.innerHTML;
    onChange(last.current === '<br>' ? '' : last.current);
  };
  const saveRange = () => {
    const sel = getSelection();
    if (sel.rangeCount && ref.current.contains(sel.anchorNode)) range.current = sel.getRangeAt(0).cloneRange();
  };
  const restore = () => {
    ref.current.focus();
    if (range.current) {
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range.current);
    }
  };
  const exec = (cmd, arg) => {
    restore();
    document.execCommand(cmd, false, arg);
    emit();
    saveRange();
  };
  const link = () => {
    restore();
    const url = window.prompt('Link URL (https://…)');
    if (!url) return;
    const href = /^(https?:\/\/|mailto:)/i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    exec('createLink', href);
  };

  const Btn = ({ icon: Icon, label, onClick }) => (
    <button type="button" title={label} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className="rounded-md p-1.5 text-muted hover:bg-subtle hover:text-ink"><Icon className="h-4 w-4" /></button>
  );
  const Sep = () => <span className="mx-1 h-5 w-px bg-line" />;
  const vars = [...BASE_VARS, ...extraVars];

  return (
    <div className="rounded-lg border border-line bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-2 py-1.5">
        <Menu keepFocus trigger={<button type="button" className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted hover:bg-subtle">Normal <ChevronDown className="h-3 w-3" /></button>}>
          {BLOCKS.map(([label, tag]) => <MenuItem key={tag} onClick={() => exec('formatBlock', tag)}>{label}</MenuItem>)}
        </Menu>
        <Sep />
        <Btn icon={Bold} label="Bold" onClick={() => exec('bold')} />
        <Btn icon={Italic} label="Italic" onClick={() => exec('italic')} />
        <Btn icon={Underline} label="Underline" onClick={() => exec('underline')} />
        <Sep />
        <Btn icon={AlignLeft} label="Align left" onClick={() => exec('justifyLeft')} />
        <Btn icon={AlignCenter} label="Align center" onClick={() => exec('justifyCenter')} />
        <Btn icon={List} label="Bullet list" onClick={() => exec('insertUnorderedList')} />
        <Btn icon={ListOrdered} label="Numbered list" onClick={() => exec('insertOrderedList')} />
        <Sep />
        <Btn icon={Link2} label="Link" onClick={link} />
        <Btn icon={Eraser} label="Clear formatting" onClick={() => exec('removeFormat')} />
        <div className="ml-auto">
          <Menu keepFocus align="right" trigger={
            <button type="button" className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary-soft">
              <Braces className="h-3.5 w-3.5" /> Personalization <ChevronDown className="h-3 w-3" />
            </button>}>
            {vars.map((v) => <MenuItem key={v} onClick={() => exec('insertText', `{{${v}}}`)}><code className="text-xs">{`{{${v}}}`}</code></MenuItem>)}
          </Menu>
        </div>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Email body"
        data-placeholder="Write your email… use {{name}}, {{company}} to personalize"
        className="editor rich px-4 py-3 leading-relaxed outline-none"
        style={{ minHeight }}
        onInput={emit}
        onBlur={saveRange}
        onKeyUp={saveRange}
        onMouseUp={saveRange}
        onPaste={(e) => {
          // paste as plain text to avoid dragging in foreign styles
          e.preventDefault();
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
        }}
      />
    </div>
  );
}
