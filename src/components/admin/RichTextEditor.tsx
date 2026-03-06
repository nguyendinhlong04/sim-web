"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useEffect, useCallback, useState, useRef } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  Palette,
  Table as TableIcon,
  Quote,
  Minus,
  Undo2,
  Redo2,
  ChevronDown,
  Plus,
  Trash2,
  Columns3,
  Rows3,
  RemoveFormatting,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
};

// ── Color palette (5 columns x 4 rows = 20 colors) ───────

const COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#b7b7b7",
  "#dc2626", "#ea580c", "#d97706", "#ca8a04", "#65a30d",
  "#16a34a", "#0d9488", "#0284c7", "#2563eb", "#7c3aed",
  "#9333ea", "#c026d3", "#db2777", "#e11d48", "#f43f5e",
];

// ── Toolbar button ────────────────────────────────────────

function ToolbarBtn({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`relative flex h-8 w-8 items-center justify-center rounded-md transition-colors
        ${active ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}
        ${disabled ? "cursor-not-allowed opacity-40" : ""}
      `}
    >
      {children}
    </button>
  );
}

// ── Separator ─────────────────────────────────────────────

function Sep() {
  return <div className="mx-0.5 h-6 w-px bg-gray-200" />;
}

// ── Dropdown wrapper ──────────────────────────────────────

function Dropdown({
  trigger,
  open,
  onToggle,
  children,
  width = "w-48",
}: {
  trigger: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onToggle();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onToggle]);

  return (
    <div ref={ref} className="relative">
      {trigger}
      {open && (
        <div
          className={`absolute left-0 top-full z-50 mt-1 ${width} rounded-lg border border-gray-200 bg-white py-1 shadow-lg`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "",
  minHeight = "120px",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline" },
      }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none px-4 py-3",
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
  });

  // Sync external value changes (e.g. locale tab switch)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  // ── Dropdown states ───────────────────────────────────

  const [headingOpen, setHeadingOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);

  const closeAll = useCallback(() => {
    setHeadingOpen(false);
    setColorOpen(false);
    setTableOpen(false);
  }, []);

  // ── Link handler ──────────────────────────────────────

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  // ── Heading label ─────────────────────────────────────

  const headingLabel = editor.isActive("heading", { level: 2 })
    ? "Heading 2"
    : editor.isActive("heading", { level: 3 })
      ? "Heading 3"
      : "Normal";

  const ICON = 16;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
      {/* ── Toolbar ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50/80 px-1.5 py-1">
        {/* Undo / Redo */}
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
          <Undo2 size={ICON} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
          <Redo2 size={ICON} />
        </ToolbarBtn>

        <Sep />

        {/* Text formatting */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)">
          <Bold size={ICON} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)">
          <Italic size={ICON} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Ctrl+U)">
          <UnderlineIcon size={ICON} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <Strikethrough size={ICON} />
        </ToolbarBtn>

        <Sep />

        {/* Heading dropdown */}
        <Dropdown
          open={headingOpen}
          onToggle={() => { closeAll(); setHeadingOpen((p) => !p); }}
          width="w-44"
          trigger={
            <button
              type="button"
              onClick={() => { closeAll(); setHeadingOpen((p) => !p); }}
              className="flex h-8 items-center gap-1 rounded-md px-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              title="Heading"
            >
              <span className="min-w-[4.5rem] text-left text-xs font-medium">{headingLabel}</span>
              <ChevronDown size={14} />
            </button>
          }
        >
          <button
            type="button"
            onClick={() => { editor.chain().focus().setParagraph().run(); setHeadingOpen(false); }}
            className={`flex w-full items-center px-3 py-1.5 text-sm transition-colors hover:bg-gray-100 ${!editor.isActive("heading") ? "font-semibold text-blue-700" : "text-gray-700"}`}
          >
            Normal text
          </button>
          <button
            type="button"
            onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setHeadingOpen(false); }}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-gray-100 ${editor.isActive("heading", { level: 2 }) ? "font-semibold text-blue-700" : "text-gray-700"}`}
          >
            <Heading2 size={16} /> Heading 2
          </button>
          <button
            type="button"
            onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setHeadingOpen(false); }}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-gray-100 ${editor.isActive("heading", { level: 3 }) ? "font-semibold text-blue-700" : "text-gray-700"}`}
          >
            <Heading3 size={16} /> Heading 3
          </button>
        </Dropdown>

        <Sep />

        {/* Alignment */}
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left">
          <AlignLeft size={ICON} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center">
          <AlignCenter size={ICON} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right">
          <AlignRight size={ICON} />
        </ToolbarBtn>

        <Sep />

        {/* Lists */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <List size={ICON} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
          <ListOrdered size={ICON} />
        </ToolbarBtn>

        <Sep />

        {/* Link */}
        <ToolbarBtn onClick={setLink} active={editor.isActive("link")} title="Insert link">
          <LinkIcon size={ICON} />
        </ToolbarBtn>
        {editor.isActive("link") && (
          <ToolbarBtn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove link">
            <Unlink size={ICON} className="text-red-500" />
          </ToolbarBtn>
        )}

        {/* Blockquote */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <Quote size={ICON} />
        </ToolbarBtn>

        {/* Horizontal rule */}
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
          <Minus size={ICON} />
        </ToolbarBtn>

        <Sep />

        {/* Color picker dropdown */}
        <Dropdown
          open={colorOpen}
          onToggle={() => { closeAll(); setColorOpen((p) => !p); }}
          width="w-[11.5rem]"
          trigger={
            <button
              type="button"
              onClick={() => { closeAll(); setColorOpen((p) => !p); }}
              className="relative flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              title="Text color"
            >
              <Palette size={ICON} />
              {/* Active color indicator bar */}
              <span
                className="absolute bottom-1 left-1.5 right-1.5 h-0.5 rounded-full"
                style={{ backgroundColor: editor.getAttributes("textStyle").color || "#000000" }}
              />
            </button>
          }
        >
          <div className="px-2 pb-2 pt-1">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Text color
            </div>
            <div className="grid grid-cols-5 gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { editor.chain().focus().setColor(c).run(); setColorOpen(false); }}
                  className="h-6 w-6 rounded-md border border-gray-200 transition-all hover:scale-110 hover:shadow-md"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => { editor.chain().focus().unsetColor().run(); setColorOpen(false); }}
              className="mt-2 flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <RemoveFormatting size={12} /> Reset color
            </button>
          </div>
        </Dropdown>

        <Sep />

        {/* Table dropdown */}
        <Dropdown
          open={tableOpen}
          onToggle={() => { closeAll(); setTableOpen((p) => !p); }}
          width="w-52"
          trigger={
            <button
              type="button"
              onClick={() => { closeAll(); setTableOpen((p) => !p); }}
              className={`flex h-8 items-center gap-0.5 rounded-md px-1.5 transition-colors
                ${editor.isActive("table") ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}
              `}
              title="Table"
            >
              <TableIcon size={ICON} />
              <ChevronDown size={12} />
            </button>
          }
        >
          {/* Insert table */}
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
              setTableOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100"
          >
            <Plus size={14} /> Insert table (3x3)
          </button>

          {/* Only show management items when cursor is inside a table */}
          {editor.isActive("table") && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <button
                type="button"
                onClick={() => { editor.chain().focus().addColumnAfter().run(); setTableOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100"
              >
                <Columns3 size={14} /> Add column
              </button>
              <button
                type="button"
                onClick={() => { editor.chain().focus().addRowAfter().run(); setTableOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100"
              >
                <Rows3 size={14} /> Add row
              </button>
              <button
                type="button"
                onClick={() => { editor.chain().focus().deleteColumn().run(); setTableOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100"
              >
                <Columns3 size={14} className="text-red-400" /> Delete column
              </button>
              <button
                type="button"
                onClick={() => { editor.chain().focus().deleteRow().run(); setTableOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100"
              >
                <Rows3 size={14} className="text-red-400" /> Delete row
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button
                type="button"
                onClick={() => { editor.chain().focus().deleteTable().run(); setTableOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 size={14} /> Delete table
              </button>
            </>
          )}
        </Dropdown>
      </div>

      {/* ── Editor content ─────────────────────────────── */}
      <EditorContent editor={editor} />

      {/* Placeholder hint */}
      {editor.isEmpty && placeholder && (
        <div className="pointer-events-none -mt-8 px-4 text-sm text-gray-400">
          {placeholder}
        </div>
      )}
    </div>
  );
}
