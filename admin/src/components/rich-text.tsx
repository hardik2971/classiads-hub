"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icon";
import { cx } from "./ui";

const TOOLS: { cmd: string; arg?: string; label: string; icon?: string; text?: string }[] = [
  { cmd: "undo", label: "Undo", text: "↶" },
  { cmd: "redo", label: "Redo", text: "↷" },
  { cmd: "bold", label: "Bold", text: "B" },
  { cmd: "italic", label: "Italic", text: "I" },
  { cmd: "underline", label: "Underline", text: "U" },
  { cmd: "justifyLeft", label: "Align left", icon: "list" },
  { cmd: "insertUnorderedList", label: "Bullets", text: "•" },
  { cmd: "insertOrderedList", label: "Numbered", text: "1." },
  { cmd: "removeFormat", label: "Clear formatting", text: "Tx" },
];

/** Lightweight WYSIWYG (contentEditable) with an HTML source toggle. */
export function RichText({ value, onChange, minHeight = 260 }: { value: string; onChange: (html: string) => void; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState(false);

  useEffect(() => {
    if (ref.current && !source && ref.current.innerHTML !== value) ref.current.innerHTML = value || "";
  }, [value, source]);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML ?? "");
  };

  const words = (value || "").replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-line px-2 py-1.5">
        <select className="rounded-md border border-line bg-white px-2 py-1 text-sm" onChange={(e) => exec("formatBlock", e.target.value)} defaultValue="p">
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        {TOOLS.map((t) => (
          <button key={t.cmd} type="button" title={t.label} onMouseDown={(e) => e.preventDefault()} onClick={() => exec(t.cmd, t.arg)} className={cx("h-8 min-w-8 rounded-md px-2 text-sm font-semibold text-ink hover:bg-brand-50", t.cmd === "italic" && "italic", t.cmd === "underline" && "underline")}>
            {t.icon ? <Icon name={t.icon} size={16} /> : t.text}
          </button>
        ))}
        <button
          type="button"
          title="Insert link"
          onClick={() => {
            const url = prompt("Link URL");
            if (url) exec("createLink", url);
          }}
          className="h-8 rounded-md px-2 hover:bg-brand-50"
        >
          <Icon name="link" size={16} />
        </button>
        <button type="button" title="Source code" onClick={() => setSource((s) => !s)} className={cx("ml-auto h-8 rounded-md px-2 font-mono text-sm hover:bg-brand-50", source && "bg-brand-50 text-brand")}>
          {"</>"}
        </button>
      </div>
      {source ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} className="block w-full p-3 font-mono text-sm outline-none" style={{ minHeight }} />
      ) : (
        <div ref={ref} contentEditable suppressContentEditableWarning onInput={() => onChange(ref.current?.innerHTML ?? "")} className="rich-editor p-3 text-[15px] outline-none" style={{ minHeight }} />
      )}
      <div className="flex justify-end border-t border-line px-3 py-1 text-[11px] uppercase text-muted">{words} words</div>
    </div>
  );
}
