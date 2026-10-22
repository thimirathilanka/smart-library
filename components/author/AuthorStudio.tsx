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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [activeModalNote, setActiveModalNote] = useState<{
    title: string;
    type: "submission" | "revision";
    note: string;
  } | null>(null);

  useEffect(() => {
    if (!activeModalNote && !editModalOpen && !versionModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModalNote(null);
        setEditModalOpen(false);
        setVersionModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeModalNote]);

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
          <button
            type="button"
            onClick={() =>
              setActiveModalNote({
                title: item.title,
                type: "submission",
                note: item.reviewNote!,
              })
            }
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-950/20 px-3 py-2 text-left text-xs text-red-200 hover:border-red-500/50 hover:bg-red-950/40 transition-all group shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="truncate font-medium text-red-300">Review feedback attached</span>
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-red-400 underline underline-offset-2 group-hover:text-red-300">
              View note &rarr;
            </span>
          </button>
        ) : null}
        {item.revision?.status === "pending" ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs leading-5 text-amber-900">
            New version under review. Published copy stays online.
          </p>
        ) : null}
        {item.revision?.status === "rejected" && item.revision.reviewNote ? (
          <button
            type="button"
            onClick={() =>
              setActiveModalNote({
                title: item.title,
                type: "revision",
                note: item.revision!.reviewNote!,
              })
            }
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-950/20 px-3 py-2 text-left text-xs text-red-200 hover:border-red-500/50 hover:bg-red-950/40 transition-all group shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="truncate font-medium text-red-300">Revision feedback attached</span>
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-red-400 underline underline-offset-2 group-hover:text-red-300">
              View note &rarr;
            </span>
          </button>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {item.hasFile && item.status !== "published" ? (
            <a href={fileHref} target="_blank" rel="noreferrer" className="text-xs font-medium text-navy underline underline-offset-2">
              Preview PDF
            </a>
          ) : null}
          {canEdit ? (
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="text-xs font-medium text-navy underline underline-offset-2 hover:opacity-80 transition cursor-pointer"
            >
              Edit and resubmit
            </button>
          ) : null}
          {item.status === "published" ? (
            <button
              type="button"
              onClick={() => setVersionModalOpen(true)}
              className="text-xs font-medium text-navy underline underline-offset-2 hover:opacity-80 transition cursor-pointer"
            >
              New version
            </button>
          ) : null}
          {item.status === "pending" ? <WithdrawButton item={item} /> : null}
          {canEdit ? <DeleteSubmission item={item} /> : null}
        </div>
      </div>

      {/* Review Note Centered Pop-up Modal */}
      {activeModalNote ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModalNote(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-note-modal-title"
            className="relative w-full max-w-lg rounded-2xl border border-red-500/30 bg-[#161a18] p-6 text-ink shadow-2xl ring-1 ring-white/10 sm:p-7 animate-in zoom-in-95 duration-150"
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => setActiveModalNote(null)}
              className="absolute top-4 right-4 rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              aria-label="Close review note dialog"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="flex items-start gap-4 pr-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 shadow-sm">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-red-300 ring-1 ring-red-500/30">
                    {activeModalNote.type === "revision" ? "Revision Rejected" : "Submission Rejected"}
                  </span>
                  <span className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">
                    {item.kind}
                  </span>
                </div>
                <h3 id="review-note-modal-title" className="mt-1 font-serif text-xl font-medium text-white leading-snug">
                  {activeModalNote.type === "revision" ? "Revision Review Feedback" : "Editor Review Feedback"}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-white/60">
                  Document: <span className="text-white/90 font-medium">{item.title}</span>
                </p>
              </div>
            </div>

            {/* Review Note Body Callout */}
            <div className="mt-5 rounded-xl border border-red-500/25 bg-red-950/30 p-4 sm:p-5">
              <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase text-red-400">
                <span>Reason & Reviewer Note</span>
                <span className="text-[10px] text-white/40 font-normal">Direct reviewer feedback</span>
              </div>
              <div className="mt-2.5 rounded-lg bg-black/30 border border-red-500/20 p-3.5">
                <p className="text-sm leading-relaxed text-red-100 whitespace-pre-wrap font-sans">
                  {activeModalNote.note}
                </p>
              </div>
            </div>

            {/* Helpful guidance */}
            <p className="mt-4 text-xs leading-relaxed text-white/60">
              Please address the points noted by the review team above. You can update your submission details, upload a revised PDF or cover image, and resubmit for review.
            </p>

            {/* Footer Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setActiveModalNote(null)}
                className="rounded-xl border border-white/15 px-4 py-2 text-xs font-medium text-white/80 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalNote(null);
                    setEditModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition-colors cursor-pointer"
                >
                  <span>Edit & Resubmit</span>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit & Resubmit Centered Pop-up Modal */}
      {editModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-submission-modal-title"
            className="relative w-full max-w-4xl my-auto rounded-2xl border border-white/10 bg-[#161a18] p-5 sm:p-7 text-white shadow-2xl max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                    Edit & Resubmit
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-white/50 font-semibold">
                    {item.kind}
                  </span>
                </div>
                <h2 id="edit-submission-modal-title" className="mt-1 font-serif text-xl sm:text-2xl font-medium text-white">
                  Edit “{item.title}”
                </h2>
                <p className="mt-1 text-xs text-white/60">
                  Update your resource details or upload replacement files, then send for editorial review.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white transition cursor-pointer shrink-0"
                aria-label="Close edit dialog"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-1 pt-4 space-y-4">
              {item.reviewNote ? (
                <div className="rounded-xl border border-red-500/25 bg-red-950/30 p-4">
                  <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase text-red-400">
                    <span>Reviewer Feedback to Address</span>
                    <span className="text-[10px] text-white/40 font-normal">Editor Note</span>
                  </div>
                  <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-red-100 whitespace-pre-wrap font-sans">
                    “{item.reviewNote}”
                  </p>
                </div>
              ) : null}

              <div className="rounded-xl border border-white/10 bg-black/25 p-4 sm:p-6">
                <ResourceForm
                  action={resubmitResourceAction}
                  submitLabel="Send for review"
                  pendingLabel="Submitting changes…"
                  lockKind={item.kind}
                  resourceId={item.id}
                  initial={{ ...item, ...filesForEdit(item, "submission") }}
                  allowFileUpload
                  manageExistingFiles
                  authorLayout
                  onSuccess={() => {
                    setTimeout(() => setEditModalOpen(false), 1500);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* New Version Centered Pop-up Modal */}
      {versionModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setVersionModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="version-submission-modal-title"
            className="relative w-full max-w-4xl my-auto rounded-2xl border border-white/10 bg-[#161a18] p-5 sm:p-7 text-white shadow-2xl max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300">
                    New Version
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-white/50 font-semibold">
                    {item.kind}
                  </span>
                </div>
                <h2 id="version-submission-modal-title" className="mt-1 font-serif text-xl sm:text-2xl font-medium text-white">
                  Publish New Version of “{item.title}”
                </h2>
                <p className="mt-1 text-xs text-white/60">
                  Submit an updated edition. The published version remains active until this new version is reviewed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVersionModalOpen(false)}
                className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white transition cursor-pointer shrink-0"
                aria-label="Close version dialog"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-1 pt-4 space-y-4">
              {item.revision?.status === "rejected" && item.revision.reviewNote ? (
                <div className="rounded-xl border border-red-500/25 bg-red-950/30 p-4">
                  <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase text-red-400">
                    <span>Revision Feedback to Address</span>
                    <span className="text-[10px] text-white/40 font-normal">Editor Note</span>
                  </div>
                  <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-red-100 whitespace-pre-wrap font-sans">
                    “{item.revision.reviewNote}”
                  </p>
                </div>
              ) : null}

              <div className="rounded-xl border border-white/10 bg-black/25 p-4 sm:p-6">
                <ResourceForm
                  action={submitRevisionAction}
                  submitLabel="Send new version"
                  pendingLabel="Sending…"
                  lockKind={item.kind}
                  resourceId={item.id}
                  initial={revisionInitial}
                  allowFileUpload
                  manageExistingFiles
                  authorLayout
                  onSuccess={() => {
                    setTimeout(() => setVersionModalOpen(false), 1500);
                  }}
                />
                {item.revision ? <CancelRevision item={item} /> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
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
