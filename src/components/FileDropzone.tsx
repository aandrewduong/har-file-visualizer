import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { APP_COPY, DROPZONE_COPY, EXAMPLES_COPY } from "../lib/copy";
import { EXAMPLES } from "../lib/examples";
import type { Example } from "../lib/examples";

interface Props {
  onLoad: (text: string, fileName: string) => void;
  onLoadExample: (example: Example) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

const ACCEPTED_TYPES = ".har,application/json,application/octet-stream";

export function FileDropzone({
  onLoad,
  onLoadExample,
  isLoading,
  errorMessage,
}: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setSelectedName(file.name);
      const text = await file.text();
      onLoad(text, file.name);
    },
    [onLoad],
  );

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const onDragOver = useCallback((e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const borderClass = isDragOver
    ? "border-accent bg-panel-2"
    : "border-border bg-panel";

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 py-12 bg-bg">
      <div className="w-full max-w-2xl flex flex-col gap-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-fg">{APP_COPY.title}</h1>
          <p className="mt-1 text-sm text-fg-muted">{APP_COPY.subtitle}</p>
        </div>

        <label
          role="button"
          tabIndex={0}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-8 py-16 cursor-pointer transition-colors ${borderClass}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={onInputChange}
            className="sr-only"
            disabled={isLoading}
          />

          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block h-6 w-6 rounded-full border-2 border-border border-t-accent animate-spin"
              />
              <span className="text-sm text-fg-muted">
                {DROPZONE_COPY.parsing(selectedName ?? DROPZONE_COPY.fileFallback)}
              </span>
            </div>
          ) : (
            <>
              <span className="text-base text-fg">{DROPZONE_COPY.cta}</span>
              <span className="text-xs text-fg-muted">
                {selectedName ?? DROPZONE_COPY.empty}
              </span>
            </>
          )}
        </label>

        {errorMessage ? (
          <div
            role="alert"
            className="rounded border border-err/40 bg-err/10 px-3 py-2 text-sm text-err"
          >
            {errorMessage}
          </div>
        ) : null}

        <ExampleList
          examples={EXAMPLES}
          onSelect={onLoadExample}
          disabled={Boolean(isLoading)}
        />

        <div className="text-xs text-fg-muted text-center space-y-1">
          <p>
            <span className="text-fg">{DROPZONE_COPY.whatIsHeading}</span>{" "}
            {DROPZONE_COPY.whatIsBody}
          </p>
          <p>{DROPZONE_COPY.privacy}</p>
        </div>
      </div>
    </div>
  );
}

interface ExampleListProps {
  examples: readonly Example[];
  onSelect: (example: Example) => void;
  disabled: boolean;
}

function ExampleList({ examples, onSelect, disabled }: ExampleListProps) {
  if (examples.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs uppercase tracking-wide text-fg-muted text-center">
        {EXAMPLES_COPY.heading}
      </h2>
      <ul className="flex flex-col gap-2">
        {examples.map((example) => (
          <li key={example.id}>
            <button
              type="button"
              onClick={() => onSelect(example)}
              disabled={disabled}
              className="w-full text-left rounded border border-border bg-panel px-3 py-2 hover:border-accent hover:bg-panel-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <div className="text-sm text-fg">{example.label}</div>
              <div className="text-xs text-fg-muted">{example.description}</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
