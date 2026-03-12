"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Undo2,
  Redo2,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  icon: Icon,
  active,
  onClick,
  label,
}: {
  icon: typeof Bold;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "p-1.5 rounded-md transition-all cursor-pointer",
        active
          ? "text-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.12)]"
          : "text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--surface-4)]"
      )}
    >
      <Icon size={15} strokeWidth={1.8} />
    </button>
  );
}

function Separator() {
  return <div className="w-px h-4 bg-[var(--border-subtle)] mx-0.5" />;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const contentRef = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || "",
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      const cleaned = html === "<p></p>" ? "" : html;
      contentRef.current = cleaned;
      onChange(cleaned);
    },
  });

  // Re-sync content when parent changes it (e.g. switching from new → edit)
  useEffect(() => {
    if (editor && content !== contentRef.current) {
      contentRef.current = content;
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL del enlace:", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div
      className={cn(
        "rounded-[0.625rem] border border-[var(--border-default)] bg-[var(--surface-3)]",
        "focus-within:border-[rgba(var(--site-primary-rgb),0.5)]",
        "focus-within:shadow-[0_0_0_3px_rgba(var(--site-primary-rgb),0.10)]",
        "transition-all overflow-hidden"
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[var(--border-subtle)] bg-[var(--surface-2)]/50">
        <ToolbarButton
          icon={Bold}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Bold"
        />
        <ToolbarButton
          icon={Italic}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Italic"
        />
        <Separator />
        <ToolbarButton
          icon={Heading2}
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          label="Heading 2"
        />
        <ToolbarButton
          icon={Heading3}
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          label="Heading 3"
        />
        <Separator />
        <ToolbarButton
          icon={List}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="Bullet list"
        />
        <ToolbarButton
          icon={ListOrdered}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="Ordered list"
        />
        <Separator />
        <ToolbarButton
          icon={Quote}
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          label="Blockquote"
        />
        <ToolbarButton
          icon={Link2}
          active={editor.isActive("link")}
          onClick={setLink}
          label="Link"
        />
        <div className="ml-auto" />
        <ToolbarButton
          icon={Undo2}
          active={false}
          onClick={() => editor.chain().focus().undo().run()}
          label="Undo"
        />
        <ToolbarButton
          icon={Redo2}
          active={false}
          onClick={() => editor.chain().focus().redo().run()}
          label="Redo"
        />
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} className="px-4 py-2.5" />
    </div>
  );
}
