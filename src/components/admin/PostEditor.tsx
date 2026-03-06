"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type PostEditorProps = {
  content: string;
  onChange: (content: string) => void;
};

export default function PostEditor({ content, onChange }: PostEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <EditorContent editor={editor} />
    </div>
  );
}
