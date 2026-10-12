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
};

export type AuthorSubmission = ResourceFormValues & {
  id: string;
  kind: ResourceKind;
  status: PublicationStatus;
  addedAt: string;
  reviewNote?: string;
  hasFile: boolean;
  hasCover: boolean;
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
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl text-navy">Your submissions</h2>
        {submissions.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nothing submitted yet. New work stays private until an admin publishes it.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="py-2">Title</th>
                  <th>Kind</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((item) => (
                  <SubmissionRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-serif text-xl text-navy">New submission</h2>
        <p className="mb-5 text-sm text-muted">
          Submit a book or paper for review. It will not appear in the catalog until an admin publishes it.
        </p>
        <ResourceForm
          action={submitResourceAction}
          submitLabel="Submit for review"
          pendingLabel="Submitting…"
          allowFileUpload
          requireFileUpload
        />
      </section>
    </div>
  );
}

function SubmissionRow({ item }: { item: AuthorSubmission }) {
  const [versionOpen, setVersionOpen] = useState(false);
  const fileHref = item.kind === "book" ? `/api/books/${item.id}/file` : `/api/research/${item.id}/file`;
  const coverHref = item.kind === "book" ? `/api/books/${item.id}/cover` : `/api/research/${item.id}/cover`;
  const canEdit = editable.includes(item.status);
  const revisionInitial: ResourceFormValues | undefined = item.revision
    ? {
        ...item.revision,
        hasCover: item.revision.hasCover,
        currentFileName: item.revision.hasFile || item.hasFile ? "" : null,
      }
    : {
        ...item,
        hasCover: item.hasCover,
        currentFileName: item.hasFile ? "" : null,
      };

  return (
    <tr className="border-t border-line align-top">
      <td className="max-w-md py-3">
        <p className="font-medium text-navy">{item.title}</p>
        {item.status === "rejected" && item.reviewNote ? (
          <p className="mt-1 text-sm text-red-800">{item.reviewNote}</p>
        ) : null}
        {item.revision?.status === "pending" ? (
          <p className="mt-1 text-sm text-navy-mid">A new version is waiting for review. The published copy stays online.</p>
        ) : null}
        {item.revision?.status === "rejected" && item.revision.reviewNote ? (
          <p className="mt-1 text-sm text-red-800">{item.revision.reviewNote}</p>
        ) : null}
        {item.hasCover && item.status !== "published" ? (
          <img src={coverHref} alt="" className="mt-2 h-24 w-16 rounded-sm object-cover" />
        ) : null}
        {item.hasFile && item.status !== "published" ? (
          <a href={fileHref} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-navy underline">
            Preview PDF
          </a>
        ) : null}
        {canEdit ? (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-navy">Edit and send for review</summary>
            <div className="mt-4">
              <ResourceForm
                action={resubmitResourceAction}
                submitLabel="Send for review"
                pendingLabel="Sending…"
                lockKind={item.kind}
                resourceId={item.id}
                initial={{ ...item, currentFileName: item.hasFile ? "" : null, hasCover: item.hasCover }}
                allowFileUpload
              />
            </div>
          </details>
        ) : null}
        {item.status === "published" && versionOpen ? (
          <div className="mt-4">
            {item.revision?.hasCover ? (
              <img src={`${coverHref}?revision=1`} alt="" className="mb-3 h-24 w-16 rounded-sm object-cover" />
            ) : null}
            <ResourceForm
              action={submitRevisionAction}
              submitLabel="Send new version"
              pendingLabel="Sending…"
              lockKind={item.kind}
              resourceId={item.id}
              initial={revisionInitial}
              allowFileUpload
            />
            {item.revision ? <CancelRevision item={item} /> : null}
          </div>
        ) : null}
        {item.status === "pending" ? <WithdrawButton item={item} /> : null}
        {canEdit ? <DeleteSubmission item={item} /> : null}
      </td>
      <td className="py-3 capitalize">{item.kind}</td>
      <td className="py-3">{statusLabel[item.status]}</td>
      <td className="py-3 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <span>{item.addedAt}</span>
          {item.status === "published" ? (
            <button
              type="button"
              aria-expanded={versionOpen}
              aria-label={`Edit ${item.title}`}
              onClick={() => setVersionOpen((open) => !open)}
              className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-paper"
            >
              Edit
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function WithdrawButton({ item }: { item: AuthorSubmission }) {
  const [state, action, pending] = useActionState(withdrawResourceAction, {});
  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="kind" value={item.kind} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-paper disabled:opacity-60"
      >
        {pending ? "Withdrawing…" : "Withdraw from review"}
      </button>
      {state.error ? <p className="mt-1 text-xs text-red-700">{state.error}</p> : null}
      {state.success ? <p className="mt-1 text-xs text-emerald-800">{state.success}</p> : null}
    </form>
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
    <div className="mt-3">
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
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-white p-0 text-ink shadow-2xl backdrop:bg-navy/45"
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
