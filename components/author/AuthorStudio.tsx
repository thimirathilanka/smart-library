"use client";

import { resubmitResourceAction, submitResourceAction } from "@/app/actions/author";
import { ResourceForm, type ResourceFormValues } from "@/components/catalog/ResourceForm";
import type { PublicationStatus, ResourceKind } from "@/lib/types";

export type AuthorSubmission = ResourceFormValues & {
  id: string;
  kind: ResourceKind;
  status: PublicationStatus;
  addedAt: string;
  reviewNote?: string;
  hasFile: boolean;
};

const statusLabel: Record<PublicationStatus, string> = {
  pending: "Pending",
  published: "Published",
  rejected: "Rejected",
};

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
                  <tr key={item.id} className="border-t border-line align-top">
                    <td className="max-w-md py-3">
                      <p className="font-medium text-navy">{item.title}</p>
                      {item.status === "rejected" && item.reviewNote ? (
                        <p className="mt-1 text-sm text-red-800">{item.reviewNote}</p>
                      ) : null}
                      {item.hasFile && item.status !== "published" ? (
                        <a
                          href={item.kind === "book" ? `/api/books/${item.id}/file` : `/api/research/${item.id}/file`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-sm font-medium text-navy underline"
                        >
                          Preview PDF
                        </a>
                      ) : null}
                      {item.status === "rejected" ? (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm font-medium text-navy">Edit and resubmit</summary>
                          <div className="mt-4">
                            <ResourceForm
                              action={resubmitResourceAction}
                              submitLabel="Resubmit"
                              pendingLabel="Sending…"
                              lockKind={item.kind}
                              resourceId={item.id}
                              initial={item}
                              allowFileUpload
                            />
                          </div>
                        </details>
                      ) : null}
                    </td>
                    <td className="py-3 capitalize">{item.kind}</td>
                    <td className="py-3">{statusLabel[item.status]}</td>
                    <td className="py-3">{item.addedAt}</td>
                  </tr>
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
