"use client";

import { useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

// ─── tipos ──────────────────────────────────────────────────────────────────

export type RichTextEditorProps = {
  label: string;
  helper?: string;
  placeholder?: string;
  value: string;
  onChange: (html: string) => void;
  /** Abre o seletor de imagem externo */
  onRequestImage?: () => void;
  /** URL da imagem aguardando inserção (vinda do seletor externo) */
  pendingImageUrl?: string;
  onPendingImageHandled?: () => void;
  imageAlt?: string;
};

// ─── helpers ────────────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-2 text-xs font-semibold transition",
        active
          ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />;
}

// ─── componente principal ────────────────────────────────────────────────────

export function RichTextEditor({
  label,
  helper,
  placeholder,
  value,
  onChange,
  onRequestImage,
  pendingImageUrl,
  onPendingImageHandled,
  imageAlt,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noreferrer noopener", target: "_blank" },
      }),
      Image.configure({ allowBase64: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: placeholder ?? "Digite aqui...",
      }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] outline-none text-sm text-slate-900 dark:text-slate-100 " +
          "[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 " +
          "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 " +
          "[&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 dark:[&_blockquote]:text-slate-400 " +
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 " +
          "[&_li]:mb-0.5 [&_p]:mb-1 " +
          "[&_a]:text-blue-700 [&_a]:underline [&_a]:dark:text-blue-400 " +
          "[&_img]:max-h-[240px] [&_img]:rounded-xl [&_img]:border [&_img]:bg-white [&_img]:object-contain [&_img]:p-1",
      },
    },
  });

  // Sincroniza valor externo → editor (ex: ao carregar questão existente)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  // Insere imagem pendente vinda do seletor externo
  useEffect(() => {
    if (!editor || !pendingImageUrl) return;
    editor.chain().focus().setImage({
      src: pendingImageUrl,
      alt: imageAlt ?? "Imagem adicionada",
    }).run();
    onPendingImageHandled?.();
  }, [editor, pendingImageUrl, imageAlt, onPendingImageHandled]);

  const insertLink = useCallback(() => {
    const url = window.prompt("Cole a URL do link");
    if (!url?.trim()) return;
    editor?.chain().focus().setLink({ href: url.trim() }).run();
  }, [editor]);

  if (!editor) return null;

  const canUndo = editor.can().undo();
  const canRedo = editor.can().redo();

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      {/* Cabeçalho */}
      <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
        <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{label}</div>
        {helper && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</div>}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
        {/* Histórico */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!canUndo} title="Desfazer">
          ↶
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!canRedo} title="Refazer">
          ↷
        </ToolbarButton>

        <Divider />

        {/* Bloco */}
        <select
          value={
            editor.isActive("heading", { level: 2 })
              ? "h2"
              : editor.isActive("heading", { level: 3 })
              ? "h3"
              : editor.isActive("blockquote")
              ? "blockquote"
              : "paragraph"
          }
          onChange={(e) => {
            const val = e.target.value;
            if (val === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
            else if (val === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
            else if (val === "blockquote") editor.chain().focus().toggleBlockquote().run();
            else editor.chain().focus().setParagraph().run();
          }}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="paragraph">Parágrafo</option>
          <option value="h2">Título</option>
          <option value="h3">Subtítulo</option>
          <option value="blockquote">Citação</option>
        </select>

        <Divider />

        {/* Formatação inline */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Negrito"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Itálico"
        >
          <em>I</em>
        </ToolbarButton>

        <Divider />

        {/* Alinhamento */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Alinhar à esquerda"
        >
          ⬅
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Centralizar"
        >
          ☰
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Alinhar à direita"
        >
          ➡
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          active={editor.isActive({ textAlign: "justify" })}
          title="Justificar"
        >
          ≣
        </ToolbarButton>

        <Divider />

        {/* Listas */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Lista com marcadores"
        >
          • Lista
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Lista numerada"
        >
          1. Lista
        </ToolbarButton>

        <Divider />

        {/* Link e imagem */}
        <ToolbarButton onClick={insertLink} active={editor.isActive("link")} title="Inserir link">
          🔗
        </ToolbarButton>
        {onRequestImage && (
          <ToolbarButton onClick={onRequestImage} title="Inserir imagem">
            🖼
          </ToolbarButton>
        )}
      </div>

      {/* Área de edição */}
      <div className="p-4">
        <EditorContent
          editor={editor}
          className={cn(
            "rounded-xl border border-slate-200 px-4 py-3 transition",
            "focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-200",
            "dark:border-slate-700 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-500/30",
            "[&_.tiptap]:outline-none",
            "[&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none",
            "[&_.tiptap_p.is-editor-empty:first-child::before]:float-left",
            "[&_.tiptap_p.is-editor-empty:first-child::before]:h-0",
            "[&_.tiptap_p.is-editor-empty:first-child::before]:text-slate-400",
            "[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
            "dark:[&_.tiptap_p.is-editor-empty:first-child::before]:text-slate-500"
          )}
        />
      </div>
    </div>
  );
}
