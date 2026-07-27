import Button from "@douyinfe/semi-ui/lib/es/button";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";

export interface RichTextEditorLabels {
  bold: string;
  image: string;
  italic: string;
  link: string;
  linkPrompt: string;
  underline: string;
}

const defaultLabels: RichTextEditorLabels = { bold: "Bold", image: "Image", italic: "Italic", link: "Link", linkPrompt: "URL", underline: "Underline" };

export function RichTextEditor({ labels = defaultLabels, onChange, onUploadImage, placeholder, value }: { labels?: RichTextEditorLabels; onChange(value: string): void; onUploadImage(file: File): Promise<string>; placeholder: string; value: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({ content: value, extensions: [StarterKit, Underline, Link.configure({ openOnClick: false }), Image, Placeholder.configure({ placeholder })], onUpdate: ({ editor: active }) => onChange(active.getHTML()) });
  useEffect(() => { if (editor && editor.getHTML() !== value) editor.commands.setContent(value, false); }, [editor, value]);
  async function image(file?: File) { if (!editor || !file) return; const url = await onUploadImage(file); editor.chain().focus().setImage({ alt: file.name, src: url }).run(); }
  return <div className="rich-text-editor" data-testid="rich-text-editor"><Space className="rich-text-toolbar"><Button aria-label={labels.bold} onClick={() => editor?.chain().focus().toggleBold().run()} theme={editor?.isActive("bold") ? "solid" : "borderless"}>B</Button><Button aria-label={labels.italic} onClick={() => editor?.chain().focus().toggleItalic().run()} theme={editor?.isActive("italic") ? "solid" : "borderless"}>I</Button><Button aria-label={labels.underline} onClick={() => editor?.chain().focus().toggleUnderline().run()} theme={editor?.isActive("underline") ? "solid" : "borderless"}>U</Button><Button onClick={() => { const href = window.prompt(labels.linkPrompt); if (href) editor?.chain().focus().setLink({ href }).run(); }} theme="borderless">{labels.link}</Button><Button onClick={() => fileRef.current?.click()} theme="borderless">{labels.image}</Button></Space><input accept="image/*" className="visually-hidden" onChange={(event) => void image(event.target.files?.[0])} ref={fileRef} type="file" /><EditorContent editor={editor} /></div>;
}
