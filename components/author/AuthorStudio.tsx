"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  cancelRevisionAction,
  deleteAuthorResourceAction,
  resubmitResourceAction,
  submitResourceAction,
  submitRevisionAction,
  withdrawResourceAction,
} from "@/app/actions/author";
import { ResourceForm, type ResourceFormValues } from "@/components/catalog/ResourceForm";
import type { PublicationStatus, ResourceKind } from "@/lib/types";

export type AuthorRevision = ResourceFormValues & {
  status: "pending" | "rejected";
  submittedAt: string;
  reviewNote?: string;
  hasFile: boolean;
  hasCover: boolean;
  fileName?: string;
};

export type AuthorSubmission = ResourceFormValues & {
  id: string;
  kind: ResourceKind;
  status: PublicationStatus;
  addedAt: string;
  reviewNote?: string;
  hasFile: boolean;
  hasCover: boolean;
  fileName?: string;
  revision?: AuthorRevision;
};

const statusLabel: Record<PublicationStatus, string> = {
  pending: "Pending",
  published: "Published",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const editable: PublicationStatus[] = ["pending", "rejected", "withdrawn"];

export function AuthorStudio({ submissions }: { submissions: AuthorSubmission[] }) {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(17rem,1fr)]">
      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 border-b border-line pb-4">
          <p className="text-xs font-semibold tracking-[0.18em] text-navy-soft uppercase">Share your work</p>
          <h2 className="mt-1 font-serif text-2xl text-navy">New submission</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Choose a resource type, add its details, and attach the PDF. Your work stays hidden until an admin reviews and publishes it.
          </p>
        </div>
        <ResourceForm
          action={submitResourceAction}
          submitLabel="Submit for review"
          pendingLabel="Submitting…"
          allowFileUpload
          requireFileUpload
          authorLayout
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-serif text-2xl text-navy">Your submissions</h2>
            <p className="mt-1 text-sm text-muted">Track review status and manage your submitted work.</p>
          </div>
          <span className="rounded-full bg-paper px-3 py-1 text-xs font-medium text-navy-mid">
            {submissions.length} {submissions.length === 1 ? "submission" : "submissions"}
          </span>
        </div>
        {submissions.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-line bg-paper/50 px-5 py-8 text-center">
            <p className="font-medium text-navy">No submissions yet</p>
            <p className="mt-1 text-sm text-muted">Use the new submission form to add a book or research paper.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {submissions.map((item) => <SubmissionRow key={item.id} item={item} />)}
          </div>
        )}
      </section>

    </div>
  );
}

function SubmissionRow({ item }: { item: AuthorSubmission }) {
  const [versionOpen, setVersionOpen] = useState(false);
  const fileHref = item.kind === "book" ? `/api/books/${item.id}/file` : `/api/research/${item.id}/file`;
  const coverHref = item.kind === "book" ? `/api/books/${item.id}/cover` : `/api/research/${item.id}/cover`;
  const canEdit = editable.includes(item.status);
  const revisionInitial: ResourceFormValues = {
    ...(item.revision ?? item),
    ...filesForEdit(item, "revision"),
  };

  const statusColor = item.status === "published"
    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
    : item.status === "rejected"
      ? "bg-red-50 text-red-800 ring-red-200"
      : "bg-amber-50 text-amber-900 ring-amber-200";

  return (
    <article className="rounded-xl border border-line bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        {item.hasCover ? (
          <img src={coverHref} alt={`Cover for ${item.title}`} className="h-24 w-16 shrink-0 rounded-sm object-cover shadow-sm" />
        ) : (
          <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-sm border border-dashed border-line bg-paper px-1 text-center text-[10px] text-muted">
            No cover
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold tracking-wide text-muted uppercase">
              {item.kind}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${statusColor}`}>
              {statusLabel[item.status]}
            </span>
          </div>
          <h3 className="mt-1 line-clamp-2 font-serif text-base leading-snug text-navy">{item.title}</h3>
          <p className="mt-1 line-clamp-1 text-xs text-navy-mid">
            {item.kind === "book" ? item.author : item.authors}
          </p>
          <p className="mt-1 line-clamp-1 text-[11px] text-muted">
            {item.kind === "book" ? item.category : item.field} · {item.addedAt}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {item.status === "rejected" && item.reviewNote ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs leading-5 text-red-800">
            <span className="font-semibold">Review note: </span>{item.reviewNote}
          </p>
        ) : null}
        {item.revision?.status === "pending" ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs leading-5 text-amber-900">
            New version under review. Published copy stays online.
          </p>
        ) : null}
        {item.revision?.status === "rejected" && item.revision.reviewNote ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs leading-5 text-red-800">
            <span className="font-semibold">Revision note: </span>{item.revision.reviewNote}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {item.hasFile && item.status !== "published" ? (
            <a href={fileHref} target="_blank" rel="noreferrer" className="text-xs font-medium text-navy underline underline-offset-2">
              Preview PDF
            </a>
          ) : null}
          {item.status === "published" ? (
            <button
              type="button"
              aria-expanded={versionOpen}
              aria-label={`${versionOpen ? "Close editor for" : "Edit"} ${item.title}`}
              onClick={() => setVersionOpen((open) => !open)}
              className="text-xs font-medium text-navy underline underline-offset-2"
            >
              {versionOpen ? "Close editor" : "New version"}
            </button>
          ) : null}
          {item.status === "pending" ? <WithdrawButton item={item} /> : null}
          {canEdit ? <DeleteSubmission item={item} /> : null}
        </div>
        {canEdit ? (
          <details>
            <summary className="cursor-pointer text-xs font-medium text-navy underline underline-offset-2">
              Edit and resubmit
            </summary>
            <div className="mt-3 rounded-lg border border-line bg-paper/35 p-3">
              <ResourceForm
                action={resubmitResourceAction}
                submitLabel="Send for review"
                pendingLabel="Sending…"
                lockKind={item.kind}
                resourceId={item.id}
                initial={{ ...item, ...filesForEdit(item, "submission") }}
                allowFileUpload
                manageExistingFiles
              />
            </div>
          </details>
        ) : null}
        {item.status === "published" && versionOpen ? (
          <div className="rounded-lg border border-line bg-paper/35 p-3">
            <ResourceForm
              action={submitRevisionAction}
              submitLabel="Send new version"
              pendingLabel="Sending…"
              lockKind={item.kind}
              resourceId={item.id}
              initial={revisionInitial}
              allowFileUpload
              manageExistingFiles
            />
            {item.revision ? <CancelRevision item={item} /> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function filesForEdit(item: AuthorSubmission, mode: "submission" | "revision"): Pick<
  ResourceFormValues,
  "currentFileName" | "hasCover" | "coverSrc" | "clearCover"
> {
  const base = item.kind === "book" ? `/api/books/${item.id}` : `/api/research/${item.id}`;
  if (mode === "submission") {
    return {
      currentFileName: item.hasFile ? item.fileName || "PDF" : null,
      hasCover: item.hasCover,
      coverSrc: item.hasCover ? `${base}/cover` : undefined,
      clearCover: false,
    };
  }

  const revision = item.revision;
  const useRevisionFile = Boolean(revision?.hasFile);
  const useRevisionCover = Boolean(revision?.hasCover);
  const coverCleared = Boolean(revision?.clearCover);
  const hasFile = useRevisionFile || item.hasFile;
  const hasCover = useRevisionCover || (!coverCleared && item.hasCover);
  return {
    currentFileName: hasFile ? (useRevisionFile ? revision?.fileName : item.fileName) || "PDF" : null,
    hasCover,
    coverSrc: hasCover ? `${base}/cover${useRevisionCover ? "?revision=1" : ""}` : undefined,
    clearCover: coverCleared && !useRevisionCover,
  };
}

function WithdrawButton({ item }: { item: AuthorSubmission }) {
  const [state, action, pending] = useActionState(withdrawResourceAction, {});
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (state.success) dialogRef.current?.close();
  }, [state.success]);

  return (
    <div>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-paper"
      >
        Withdraw from review
      </button>
      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current && !pending) dialogRef.current?.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-white p-0 text-ink shadow-2xl backdrop:backdrop-blur-md backdrop:bg-transparent"
      >
        <form action={action} className="p-5">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="kind" value={item.kind} />
          <h3 className="font-serif text-xl text-navy">Withdraw from review?</h3>
          <p className="mt-3 text-sm leading-6 text-muted">
            Withdraw <span className="font-medium text-navy">{item.title}</span> from the review queue? You can edit and resubmit it later.
          </p>
          {state.error ? <p className="mt-3 text-sm text-red-700">{state.error}</p> : null}
          {state.success ? <p className="mt-3 text-sm text-emerald-800">{state.success}</p> : null}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              disabled={pending}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium text-navy disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-mid disabled:opacity-60"
            >
              {pending ? "Withdrawing…" : "Withdraw"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

function CancelRevision({ item }: { item: AuthorSubmission }) {
  const [state, action, pending] = useActionState(cancelRevisionAction, {});
  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="kind" value={item.kind} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-medium text-navy underline disabled:opacity-60"
      >
        {pending ? "Cancelling…" : "Cancel this version"}
      </button>
      {state.error ? <p className="mt-1 text-xs text-red-700">{state.error}</p> : null}
    </form>
  );
}

function DeleteSubmission({ item }: { item: AuthorSubmission }) {
  const [state, action, pending] = useActionState(deleteAuthorResourceAction, {});
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (state.success) dialogRef.current?.close();
  }, [state.success]);

  return (
    <div>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="text-sm font-medium text-red-700 underline"
      >
        Delete submission
      </button>
      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current && !pending) dialogRef.current?.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-white p-0 text-ink shadow-2xl backdrop:backdrop-blur-md backdrop:bg-transparent"
      >
        <form action={action} className="p-5">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="kind" value={item.kind} />
          <h3 className="font-serif text-xl text-navy">Delete this submission?</h3>
          <p className="mt-3 text-sm leading-6 text-muted">
            Delete <span className="font-medium text-navy">{item.title}</span>? The PDF and cover are removed. This cannot be undone.
          </p>
          {state.error ? <p className="mt-3 text-sm text-red-700">{state.error}</p> : null}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              disabled={pending}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium text-navy disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
            >
              {pending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
