"use client";

import { useActionState, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/format";
import type { AccessType, PublicationStatus, ResourceKind } from "@/lib/types";

type FormState = {
  error?: string;
  success?: string;
};

export type ResourceFormValues = {
  title: string;
  author?: string;
  authors?: string;
  isbn?: string;
  doi?: string;
  category?: string;
  field?: string;
  year: number;
  access: AccessType;
  description: string;
  publicationStatus?: PublicationStatus;
  currentFileName?: string | null;
};

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
}) {
  const [kind, setKind] = useState<ResourceKind>(lockKind ?? "book");
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const selected = lockKind ?? kind;

  return (
    <div>
      {lockKind ? null : (
        <div className="mb-4 flex gap-2">
          {(["book", "paper"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={selected === item}
              onClick={() => setKind(item)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm capitalize",
                selected === item ? "bg-navy text-white" : "bg-paper text-navy-mid",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      )}
      <form action={formAction} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="kind" value={selected} />
        {resourceId ? <input type="hidden" name="id" value={resourceId} /> : null}
        {allowFileUpload ? (
          <label className="rounded-xl border border-dashed border-navy/30 bg-paper px-5 py-6 text-center sm:col-span-2">
            <Upload className="mx-auto size-6 text-navy-soft" aria-hidden="true" />
            <span className="mt-2 block text-sm font-medium text-navy">
              Upload {selected === "book" ? "book" : "research paper"} PDF
            </span>
            <span className="mt-1 block text-xs text-muted">
              {requireFileUpload
                ? "PDF only, up to 25 MB"
                : "Optional. PDF only, up to 25 MB. Leave empty to keep the current file."}
            </span>
            {initial?.currentFileName ? (
              <span className="mt-3 block text-sm text-navy">
                Current file: <span className="font-medium">{initial.currentFileName}</span>
              </span>
            ) : initial?.currentFileName === "" ? (
              <span className="mt-3 block text-sm text-muted">A PDF is attached.</span>
            ) : initial?.currentFileName === null ? (
              <span className="mt-3 block text-sm text-muted">No PDF is currently attached.</span>
            ) : null}
            <input
              type="file"
              name="file"
              accept="application/pdf,.pdf"
              required={requireFileUpload}
              className="mt-4 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-navy hover:file:bg-white/70"
            />
          </label>
        ) : null}
        <Field label="Title" name="title" defaultValue={initial?.title} required maxLength={200} />
        {selected === "book" ? (
          <Field label="Author" name="author" defaultValue={initial?.author} required maxLength={120} />
        ) : (
          <Field label="Authors" name="authors" defaultValue={initial?.authors} required maxLength={3000} />
        )}
        {selected === "book" ? (
          <Field label="ISBN" name="isbn" defaultValue={initial?.isbn} maxLength={32} />
        ) : (
          <Field label="DOI" name="doi" defaultValue={initial?.doi} maxLength={200} />
        )}
        {selected === "book" ? (
          <Field label="Category" name="category" defaultValue={initial?.category} required maxLength={80} />
        ) : (
          <Field label="Research field" name="field" defaultValue={initial?.field} required maxLength={80} />
        )}
        <Field
          label="Year"
          name="year"
          type="number"
          required
          min={1000}
          max={new Date().getFullYear() + 1}
          defaultValue={initial ? String(initial.year) : undefined}
        />
        <label className="text-xs font-semibold tracking-wide text-muted uppercase">
          Access
          <select
            name="access"
            defaultValue={initial?.access ?? "open"}
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
              defaultValue={initial?.publicationStatus ?? "published"}
              className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal text-ink"
            >
              <option value="pending">Pending</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
        ) : null}
        <label className="text-xs font-semibold tracking-wide text-muted uppercase sm:col-span-2">
          Description / abstract
          <textarea
            name="description"
            required
            maxLength={4000}
            defaultValue={initial?.description}
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
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-mid disabled:opacity-60 sm:col-span-2"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required = false,
  maxLength,
  type = "text",
  min,
  max,
}: {
  label: string;
  name: string;
  defaultValue?: string;
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
        defaultValue={defaultValue}
        className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm font-normal text-ink outline-none"
      />
    </label>
  );
}
