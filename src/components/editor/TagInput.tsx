import { useState } from "react";
import { XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { addTags, parseTags } from "@/domain/tags";

interface TagInputProps {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
}

/** Tags as removable chips. Enter or "," adds, Backspace on an empty field removes the last one. */
export function TagInput({ id, value, onChange }: TagInputProps) {
  const [draft, setDraft] = useState("");

  function commit(text: string) {
    const tags = parseTags(text);
    if (tags.length > 0) onChange(addTags(value, tags));
    setDraft("");
  }

  return (
    <div className="flex min-h-8 flex-wrap items-center gap-1 rounded-lg border border-input px-1.5 py-1 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
          {tag}
          <button
            type="button"
            aria-label={`Remove tag ${tag}`}
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="rounded-sm opacity-60 outline-none hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <XIcon className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        id={id}
        value={draft}
        placeholder={value.length === 0 ? "Add tags…" : ""}
        onChange={(e) => {
          // Typing or pasting a comma completes the tag(s) before it.
          if (e.target.value.includes(",")) commit(e.target.value);
          else setDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault(); // add the tag instead of submitting the form
            commit(draft);
          }
          if (e.key === "Backspace" && draft === "" && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => commit(draft)}
        className="h-6 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
