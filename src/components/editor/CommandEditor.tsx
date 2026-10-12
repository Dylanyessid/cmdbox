import { useEffect, useId, useRef, useState } from "react";
import {
  AlignLeftIcon,
  SaveIcon,
  SquareTerminalIcon,
  TagsIcon,
  TypeIcon,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Command } from "@/domain/models";
import { TagInput } from "./TagInput";

/** The fields of a command edited in this form. */
export interface CommandDraft {
  name: string;
  template: string;
  description: string;
  tags: string[];
}

interface CommandEditorProps {
  /** The command being edited, or null when drafting a new one. */
  command: Command | null;
  collectionName: string;
  onSave: (draft: CommandDraft) => Promise<void>;
}

/** Edits one command. Render it with a `key` per command so switching commands resets the form. */
export function CommandEditor({ command, collectionName, onSave }: CommandEditorProps) {
  const ids = useId();
  // What is saved, recomputed on every render: after saving, `command` comes back updated
  // and the form becomes clean again. `useState` only uses it as the draft's first value.
  const initial = toDraft(command);
  const [draft, setDraft] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const isDirty = !isSameDraft(draft, initial);
  const errors = {
    name: draft.name.trim() === "",
    template: draft.template.trim() === "",
  };

  async function save() {
    if (!isDirty || isSaving) return;
    if (errors.name || errors.template) {
      setShowErrors(true);
      return;
    }
    // Save exactly what the form shows, so it is clean once the saved command comes back.
    const cleanDraft = { ...draft, name: draft.name.trim() };
    setDraft(cleanDraft);
    setIsSaving(true);
    try {
      await onSave(cleanDraft);
    } finally {
      setIsSaving(false);
    }
  }

  // Ctrl+S / Cmd+S anywhere while the editor is open. The ref always holds the latest `save`.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function update<K extends keyof CommandDraft>(field: K, value: CommandDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex h-full flex-col"
    >
      <header className="flex items-center gap-3 border-b px-6 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{collectionName}</p>
          <h2 className="truncate font-heading text-lg font-semibold">
            {command ? command.name : "New command"}
          </h2>
        </div>
        {isDirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
        <Button type="submit" disabled={!isDirty || isSaving} title="Save (Ctrl+S)">
          <SaveIcon />
          Save
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-5">
          <Field
            id={`${ids}-name`}
            label="Name"
            icon={TypeIcon}
            error={showErrors && errors.name && "Name is required"}
          >
            <Input
              id={`${ids}-name`}
              autoFocus={command === null}
              value={draft.name}
              maxLength={100}
              placeholder="e.g. Follow container logs"
              aria-invalid={(showErrors && errors.name) || undefined}
              onChange={(e) => update("name", e.target.value)}
            />
          </Field>

          <Field
            id={`${ids}-template`}
            label="Command"
            icon={SquareTerminalIcon}
            error={showErrors && errors.template && "Command is required"}
          >
            <Textarea
              id={`${ids}-template`}
              value={draft.template}
              rows={3}
              placeholder="docker logs -f {{container}}"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              aria-invalid={(showErrors && errors.template) || undefined}
              onChange={(e) => update("template", e.target.value)}
              className="font-mono"
            />
          </Field>

          <Field id={`${ids}-description`} label="Description" icon={AlignLeftIcon}>
            <Textarea
              id={`${ids}-description`}
              value={draft.description}
              rows={2}
              placeholder="What does this command do?"
              onChange={(e) => update("description", e.target.value)}
            />
          </Field>

          <Field id={`${ids}-tags`} label="Tags" icon={TagsIcon}>
            <TagInput id={`${ids}-tags`} value={draft.tags} onChange={(tags) => update("tags", tags)} />
          </Field>
        </div>
      </div>
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string | false;
  children: React.ReactNode;
}

function Field({ id, label, icon: Icon, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        <Icon className="size-3.5 text-muted-foreground" aria-hidden />
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function toDraft(command: Command | null): CommandDraft {
  return {
    name: command?.name ?? "",
    template: command?.template ?? "",
    description: command?.description ?? "",
    tags: command?.tags ?? [],
  };
}

function isSameDraft(a: CommandDraft, b: CommandDraft) {
  return (
    a.name === b.name &&
    a.template === b.template &&
    a.description === b.description &&
    a.tags.length === b.tags.length &&
    a.tags.every((tag, i) => tag === b.tags[i])
  );
}
