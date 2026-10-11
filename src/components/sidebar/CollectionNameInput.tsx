import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface CollectionNameInputProps {
  initialValue?: string;
  placeholder?: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

/**
 * Inline name editor used to create and rename collections.
 * Enter saves, Escape cancels, and leaving the field saves if the name is valid.
 */
export function CollectionNameInput({
  initialValue = "",
  placeholder,
  onSubmit,
  onCancel,
}: CollectionNameInputProps) {
  const [value, setValue] = useState(initialValue);
  const [isInvalid, setIsInvalid] = useState(false);
  // Enter followed by the blur caused by unmounting must not submit twice.
  const isDone = useRef(false);

  function finish(action: () => void) {
    if (isDone.current) return;
    isDone.current = true;
    action();
  }

  function submit() {
    const name = value.trim();
    if (name === initialValue.trim()) return finish(onCancel);
    if (name === "") {
      setIsInvalid(true);
      return;
    }
    finish(() => onSubmit(name));
  }

  return (
    <Input
      autoFocus
      value={value}
      placeholder={placeholder}
      maxLength={100}
      aria-label="Collection name"
      aria-invalid={isInvalid || undefined}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        setValue(e.target.value);
        setIsInvalid(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") submit();
        if (e.key === "Escape") finish(onCancel);
      }}
      onBlur={() => (value.trim() === "" ? finish(onCancel) : submit())}
      className="h-7"
    />
  );
}
