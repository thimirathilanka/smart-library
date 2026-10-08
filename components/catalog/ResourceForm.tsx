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
};

export function ResourceForm({
  action,
  submitLabel,
  pendingLabel = "Saving…",
  lockKind,
  resourceId,
  initial,
  showFileStub = false,
  allowPublicationStatus = false,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  pendingLabel?: string;
  lockKind?: ResourceKind;
  resourceId?: string;
  initial?: ResourceFormValues;
  showFileStub?: boolean;
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
        {showFileStub ? (
          <label className="rounded-2xl border border-dashed border-navy/30 bg-paper px-6 py-10 text-center sm:col-span-2">
            <Upload className="mx-auto size-6 text-navy-soft" />
            <p className="mt-2 text-sm text-navy">Drop a manuscript or choose a file</p>
            <p className="text-xs text-muted">PDF for in-browser reading</p>
            <input type="file" className="sr-only" />
          </label>
        ) : null}
        <Field label="Title" name="title" defaultValue={initial?.title} />
        {selected === "book" ? (
          <Field label="Author" name="author" defaultValue={initial?.author} />
        ) : (
          <Field label="Authors" name="authors" defaultValue={initial?.authors} />
        )}
        {selected === "book" ? (
          <Field label="ISBN" name="isbn" defaultValue={initial?.isbn} />
        ) : (
          <Field label="DOI" name="doi" defaultValue={initial?.doi} />
        )}
        {selected === "book" ? (
          <Field label="Category" name="category" defaultValue={initial?.category} />
        ) : (
          <Field label="Research field" name="field" defaultValue={initial?.field} />
        )}
        <Field label="Year" name="year" defaultValue={initial ? String(initial.year) : undefined} />
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
            defaultValue={initial?.description}
            className="mt-1.5 min-h-28 w-full rounded-lg border border-line px-3 py-2 text-sm font-normal text-ink outline-none"
          />
        </label>
        {state.error ? <p className="text-sm text-red-700 sm:col-span-2">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-emerald-800 sm:col-span-2">{state.success}</p> : null}
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

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label className="text-xs font-semibold tracking-wide text-muted uppercase">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm font-normal text-ink outline-none"
      />
    </label>
  );
}
