"use client";

import { useActionState, useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/format";
import type { AccessType, PublicationStatus, ResourceKind } from "@/lib/types";

type FormState = {
  error?: string;
  success?: string;
  warning?: string;
};

export type ResourceFormValues = {
  title: string;
  author?: string;
  authors?: string;
  isbn?: string;
  doi?: string;
  category?: string;
  field?: string;
  publisher?: string;
  language?: string;
  venue?: string;
  pages?: string | number;
  keywords?: string;
  year: number;
  access: AccessType;
  description: string;
  publicationStatus?: PublicationStatus;
  currentFileName?: string | null;
  hasCover?: boolean;
  coverSrc?: string;
  clearCover?: boolean;
};

type EditableValues = {
  title: string;
  author: string;
  authors: string;
  isbn: string;
  doi: string;
  category: string;
  field: string;
  publisher: string;
  language: string;
  venue: string;
  pages: string;
  keywords: string;
  year: string;
  access: AccessType;
  description: string;
  publicationStatus: PublicationStatus;
};

function valuesFromInitial(initial?: ResourceFormValues): EditableValues {
  return {
    title: initial?.title ?? "",
    author: initial?.author ?? "",
    authors: initial?.authors ?? "",
    isbn: initial?.isbn ?? "",
    doi: initial?.doi ?? "",
    category: initial?.category ?? "",
    field: initial?.field ?? "",
    publisher: initial?.publisher ?? "",
    language: initial?.language ?? "",
    venue: initial?.venue ?? "",
    pages: initial?.pages != null ? String(initial.pages) : "",
    keywords: initial?.keywords ?? "",
    year: initial ? String(initial.year) : "",
    access: initial?.access ?? "open",
    description: initial?.description ?? "",
    publicationStatus: initial?.publicationStatus ?? "published",
  };
}

export function ResourceForm({
  action,
  submitLabel,
  pendingLabel = "Saving…",
  lockKind,
  resourceId,
  initial,
  allowFileUpload = false,
  requireFileUpload = false,
  allowPublicationStatus = false,
  manageExistingFiles = false,
  authorLayout = false,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  pendingLabel?: string;
  lockKind?: ResourceKind;
  resourceId?: string;
  initial?: ResourceFormValues;
  allowFileUpload?: boolean;
  requireFileUpload?: boolean;
  allowPublicationStatus?: boolean;
  manageExistingFiles?: boolean;
  authorLayout?: boolean;
}) {
  const [kind, setKind] = useState<ResourceKind>(lockKind ?? "book");
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const [values, setValues] = useState<EditableValues>(() => valuesFromInitial(initial));
  const [keepFile, setKeepFile] = useState(true);
  const [keepCover, setKeepCover] = useState(true);
  const [nextFileName, setNextFileName] = useState<string | null>(null);
  const [nextCoverName, setNextCoverName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCover, setSelectedCover] = useState<File | null>(null);
  const selectedFileRef = useRef<File | null>(null);
  const selectedCoverRef = useRef<File | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [fileDropError, setFileDropError] = useState<string | null>(null);
  const [coverDropError, setCoverDropError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<"file" | "cover" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const selected = lockKind ?? kind;
  const storedFileName = initial?.currentFileName || null;
  const coverKept = Boolean(nextCoverName) || (initial?.hasCover ? keepCover : !initial?.clearCover);

  useEffect(() => {
    if (state.error) {
      if (selectedFileRef.current) {
        placeFile(fileInputRef.current, selectedFileRef.current);
        setNextFileName(selectedFileRef.current.name);
      }
      if (selectedCoverRef.current) {
        placeFile(coverInputRef.current, selectedCoverRef.current);
        setNextCoverName(selectedCoverRef.current.name);
      }
      return;
    }
    if (!state.success) return;

    setKeepFile(true);
    setKeepCover(true);
    setNextFileName(null);
    setNextCoverName(null);
    setSelectedFile(null);
    setSelectedCover(null);
    selectedFileRef.current = null;
    selectedCoverRef.current = null;
    setClientError(null);
    setFileDropError(null);
    setCoverDropError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (coverInputRef.current) coverInputRef.current.value = "";
    if (!resourceId) setValues(valuesFromInitial());
  }, [state, resourceId]);

  function changeValue(name: keyof EditableValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }) as EditableValues);
  }

  function clearChosenFile() {
    setNextFileName(null);
    setSelectedFile(null);
    selectedFileRef.current = null;
    setKeepFile(true);
    setClientError(null);
    setFileDropError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function clearChosenCover() {
    setNextCoverName(null);
    setSelectedCover(null);
    selectedCoverRef.current = null;
    setKeepCover(true);
    setCoverDropError(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

  function placeFile(input: HTMLInputElement | null, file: File) {
    if (!input) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
  }

  function takeDroppedFile(target: "file" | "cover", file: File | undefined) {
    if (target === "file") {
      if (!file || (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))) {
        setFileDropError(file ? "Only PDF files can be uploaded." : "Drop a PDF file.");
        return;
      }
      placeFile(fileInputRef.current, file);
      setSelectedFile(file);
      selectedFileRef.current = file;
      setNextFileName(file.name);
      setClientError(null);
      setFileDropError(null);
      return;
    }
    const image =
      file &&
      (file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/webp" ||
        /\.(jpe?g|png|webp)$/i.test(file.name));
    if (!file || !image) {
      setCoverDropError(file ? "Cover images must be JPEG, PNG, or WebP." : "Drop a cover image.");
      return;
    }
    placeFile(coverInputRef.current, file);
    setSelectedCover(file);
    selectedCoverRef.current = file;
    setNextCoverName(file.name);
    setCoverDropError(null);
  }

  function dropHandlers(target: "file" | "cover") {
    return {
      onDragEnter: (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setDragOver(target);
      },
      onDragOver: (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "copy";
        setDragOver(target);
      },
      onDragLeave: (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setDragOver((current) => (current === target ? null : current));
      },
      onDrop: (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setDragOver(null);
        takeDroppedFile(target, event.dataTransfer.files?.[0]);
      },
    };
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (manageExistingFiles && storedFileName && !keepFile && !nextFileName) {
      event.preventDefault();
      setClientError("Add a PDF to replace the current one.");
    }
  }

  return (
    <div>
      {lockKind ? null : (
        <div className={authorLayout ? "mb-5 grid gap-3 sm:grid-cols-2" : "mb-4 flex gap-2"}>
          {(["book", "paper"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={selected === item}
              onClick={() => setKind(item)}
              className={cn(
                authorLayout
                  ? "rounded-xl border p-4 text-left transition-colors"
                  : "rounded-full px-4 py-1.5 text-sm capitalize",
                selected === item ? "border-navy bg-navy text-white" : "border-line bg-white text-navy-mid hover:bg-paper",
              )}
            >
              {authorLayout ? (
                <>
                  <span className="block font-medium capitalize">{item}</span>
                  <span className={cn("mt-1 block text-xs font-normal normal-case", selected === item ? "text-white/75" : "text-muted")}>
                    {item === "book" ? "Submit a book for review" : "Submit a research paper"}
                  </span>
                </>
              ) : item}
            </button>
          ))}
        </div>
      )}
      <form
        action={formAction}
        onSubmit={onSubmit}
        className={cn("grid gap-4", authorLayout ? "lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)]" : "sm:grid-cols-2")}
      >
        <input type="hidden" name="kind" value={selected} />
        {resourceId ? <input type="hidden" name="id" value={resourceId} /> : null}
        {manageExistingFiles ? (
          <>
            <input type="hidden" name="keepFile" value={!storedFileName || keepFile || nextFileName ? "1" : "0"} />
            <input type="hidden" name="keepCover" value={coverKept ? "1" : "0"} />
          </>
        ) : null}
        {allowFileUpload ? (
          <div className={authorLayout ? "space-y-4 lg:col-start-1 lg:row-span-2" : "contents"}>
          <div
            {...dropHandlers("file")}
            className={cn(
              "rounded-xl border border-dashed bg-paper px-5 py-6 text-center",
              dragOver === "file" ? "border-navy bg-white" : "border-navy/30",
            )}
          >
            <Upload className="mx-auto size-6 text-navy-soft" aria-hidden="true" />
            <span className="mt-2 block text-sm font-medium text-navy">
              Upload {selected === "book" ? "book" : "research paper"} PDF
            </span>
            <span className="mt-1 block text-xs text-muted">
              {requireFileUpload
                ? "PDF only, up to 25 MB"
                : manageExistingFiles && storedFileName
                  ? "Optional. PDF only, up to 25 MB. Leave the current file to keep it, or add a new PDF to replace it."
                  : "Optional. PDF only, up to 25 MB. Leave empty to keep the current file."}
            </span>
            {manageExistingFiles && nextFileName ? (
              <ExistingFile label={nextFileName} onRemove={clearChosenFile} />
            ) : manageExistingFiles && keepFile && storedFileName ? (
              <ExistingFile label={storedFileName} onRemove={() => setKeepFile(false)} />
            ) : manageExistingFiles && storedFileName && !keepFile ? (
              <span className="mt-3 block text-sm text-muted">The current PDF will be removed. Add a new PDF to replace it.</span>
            ) : !manageExistingFiles && initial?.currentFileName ? (
              <span className="mt-3 block text-sm text-navy">
                Current file: <span className="font-medium">{initial.currentFileName}</span>
              </span>
            ) : !manageExistingFiles && initial?.currentFileName === "" ? (
              <span className="mt-3 block text-sm text-muted">A PDF is attached.</span>
            ) : !manageExistingFiles && initial?.currentFileName === null ? (
              <span className="mt-3 block text-sm text-muted">No PDF is currently attached.</span>
            ) : null}
            {clientError || fileDropError ? (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {clientError || fileDropError}
              </p>
            ) : null}
            {manageExistingFiles ? <span className="mt-4 block text-xs font-medium text-navy">Add a new PDF</span> : null}
            <span className="mt-3 block text-xs text-muted">Drop a PDF here, or browse.</span>
            <input
              ref={fileInputRef}
              type="file"
              name="file"
              accept="application/pdf,.pdf"
              required={requireFileUpload}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedFile(file);
                selectedFileRef.current = file;
                setNextFileName(file?.name ?? null);
                setClientError(null);
                setFileDropError(null);
              }}
              className="mt-4 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-navy hover:file:bg-white/70"
            />
          </div>
          <div
            {...dropHandlers("cover")}
            className={cn(
              "rounded-xl border border-dashed bg-paper px-5 py-6 text-center",
              dragOver === "cover" ? "border-navy bg-white" : "border-navy/30",
            )}
          >
            <Upload className="mx-auto size-6 text-navy-soft" aria-hidden="true" />
            <span className="mt-2 block text-sm font-medium text-navy">Cover image</span>
            <span className="mt-1 block text-xs text-muted">
              Optional. JPEG, PNG, or WebP, up to 2 MB.
              {manageExistingFiles && initial?.hasCover
                ? " Leave the current cover to keep it, or add a new image to replace it."
                : !manageExistingFiles && initial
                  ? " Leave empty to keep the current cover."
                  : ""}
            </span>
            {manageExistingFiles && nextCoverName ? (
              <ExistingFile label={nextCoverName} onRemove={clearChosenCover} />
            ) : manageExistingFiles && keepCover && initial?.hasCover ? (
              <span className="mt-3 flex items-center justify-center gap-3">
                {initial.coverSrc ? (
                  <img src={initial.coverSrc} alt="" className="h-16 w-12 rounded-sm object-cover" />
                ) : null}
                <ExistingFile label="Cover image" className="mt-0" onRemove={() => setKeepCover(false)} />
              </span>
            ) : manageExistingFiles && initial?.hasCover && !keepCover ? (
              <span className="mt-3 block text-sm text-muted">The current cover will be removed.</span>
            ) : manageExistingFiles ? (
              <span className="mt-3 block text-sm text-muted">No cover image yet.</span>
            ) : initial?.hasCover ? (
              <span className="mt-3 block text-sm text-navy">A cover image is attached.</span>
            ) : initial ? (
              <span className="mt-3 block text-sm text-muted">No cover image yet.</span>
            ) : null}
            {coverDropError ? (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {coverDropError}
              </p>
            ) : null}
            {manageExistingFiles ? <span className="mt-4 block text-xs font-medium text-navy">Add a new cover</span> : null}
            <span className="mt-3 block text-xs text-muted">Drop an image here, or browse.</span>
            <input
              ref={coverInputRef}
              type="file"
              name="cover"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedCover(file);
                selectedCoverRef.current = file;
                setNextCoverName(file?.name ?? null);
                setCoverDropError(null);
              }}
              className="mt-4 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-navy hover:file:bg-white/70"
            />
          </div>
          </div>
        ) : null}
        <div className={authorLayout ? "space-y-4 lg:col-start-2 lg:row-start-1" : "contents"}>
        <div className={authorLayout ? "grid gap-4 sm:grid-cols-2" : "contents"}>
        <Field label="Title" name="title" value={values.title} onValueChange={changeValue} required maxLength={200} />
        {selected === "book" ? (
          <Field label="Author" name="author" value={values.author} onValueChange={changeValue} required maxLength={120} />
        ) : (
          <Field label="Authors" name="authors" value={values.authors} onValueChange={changeValue} required maxLength={3000} />
        )}
        {selected === "book" ? (
          <Field label="ISBN" name="isbn" value={values.isbn} onValueChange={changeValue} maxLength={32} />
        ) : (
          <Field label="DOI" name="doi" value={values.doi} onValueChange={changeValue} maxLength={200} />
        )}
        {selected === "book" ? (
          <Field label="Category" name="category" value={values.category} onValueChange={changeValue} required maxLength={80} />
        ) : (
          <Field label="Research field" name="field" value={values.field} onValueChange={changeValue} required maxLength={80} />
        )}
        {selected === "book" ? (
          <Field label="Publisher" name="publisher" value={values.publisher} onValueChange={changeValue} required maxLength={120} />
        ) : (
          <Field label="Venue" name="venue" value={values.venue} onValueChange={changeValue} required maxLength={200} />
        )}
        {selected === "book" ? (
          <Field label="Language" name="language" value={values.language} onValueChange={changeValue} required maxLength={80} />
        ) : (
          <Field
            label="Keywords (comma-separated)"
            name="keywords"
            value={values.keywords}
            onValueChange={changeValue}
            required
            maxLength={2000}
          />
        )}
        {selected === "book" ? (
          <Field
            label="Pages"
            name="pages"
            type="number"
            required
            min={1}
            max={100000}
            value={values.pages}
            onValueChange={changeValue}
          />
        ) : (
          <Field label="Page range" name="pages" value={values.pages} onValueChange={changeValue} required maxLength={40} />
        )}
        <Field
          label="Year"
          name="year"
          type="number"
          required
          min={1000}
          max={new Date().getFullYear() + 1}
          value={values.year}
          onValueChange={changeValue}
        />
        </div>
        <label className="text-xs font-semibold tracking-wide text-muted uppercase">
          Access
          <select
            name="access"
            value={values.access}
            onChange={(event) => changeValue("access", event.target.value as AccessType)}
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal text-ink"
          >
            <option value="open">Open Access</option>
            <option value="members">Members only</option>
          </select>
        </label>
        {allowPublicationStatus ? (
          <label className="text-xs font-semibold tracking-wide text-muted uppercase">
            Publication status
            <select
              name="publicationStatus"
              value={values.publicationStatus}
              onChange={(event) => changeValue("publicationStatus", event.target.value as PublicationStatus)}
              className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal text-ink"
            >
              <option value="pending">Pending</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </label>
        ) : null}
        <label className="text-xs font-semibold tracking-wide text-muted uppercase sm:col-span-2">
          Description / abstract
          <textarea
            name="description"
            required
            maxLength={4000}
            value={values.description}
            onChange={(event) => changeValue("description", event.target.value)}
            className="mt-1.5 min-h-28 w-full rounded-lg border border-line px-3 py-2 text-sm font-normal text-ink outline-none"
          />
        </label>
        {state.error ? (
          <p role="alert" className="text-sm text-red-700 sm:col-span-2">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p role="status" className="text-sm text-emerald-800 sm:col-span-2">
            {state.success}
          </p>
        ) : null}
        {state.warning ? (
          <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 sm:col-span-2">
            {state.warning}
          </p>
        ) : null}
        </div>
        <button
          type="submit"
          disabled={pending}
          className={cn("rounded-full bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-mid disabled:opacity-60", authorLayout ? "lg:col-span-2" : "sm:col-span-2")}
        >
          {pending ? pendingLabel : submitLabel}
        </button>
      </form>
    </div>
  );
}

function ExistingFile({
  label,
  onRemove,
  className,
}: {
  label: string;
  onRemove: () => void;
  className?: string;
}) {
  return (
    <span className={cn("mt-3 inline-flex max-w-full items-center gap-2 rounded-full bg-white px-3 py-1.5 text-left text-sm text-navy", className)}>
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="shrink-0 rounded-full p-0.5 text-muted hover:bg-paper hover:text-navy"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </span>
  );
}

function Field({
  label,
  name,
  value,
  onValueChange,
  required = false,
  maxLength,
  type = "text",
  min,
  max,
}: {
  label: string;
  name: keyof EditableValues;
  value: string;
  onValueChange: (name: keyof EditableValues, value: string) => void;
  required?: boolean;
  maxLength?: number;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className="text-xs font-semibold tracking-wide text-muted uppercase">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        maxLength={type === "number" ? undefined : maxLength}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onValueChange(name, event.target.value)}
        className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm font-normal text-ink outline-none"
      />
    </label>
  );
}
