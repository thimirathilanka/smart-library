"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Ban,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  LoaderCircle,
  FileText,
  History,
  Pencil,
  RotateCcw,
  Shield,
  TriangleAlert,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
  Check,
} from "lucide-react";
import {
  createResourceAction,
  deleteResourceAction,
  manageMemberAction,
  publishResourceAction,
  rejectResourceAction,
  updateResourceAction,
} from "@/app/actions/admin";
import { ResourceForm, type ResourceFormValues } from "@/components/catalog/ResourceForm";
import { cn, formatNumber } from "@/lib/format";
import type { AccessType, AdminCatalog, Book, PublicationStatus, ResearchPaper } from "@/lib/types";

const sections = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "books", label: "Manage books", icon: BookOpen },
  { id: "papers", label: "Manage papers", icon: FileText },
  { id: "users", label: "Users", icon: Users },
  { id: "review", label: "Review", icon: ClipboardCheck },
  { id: "activity", label: "Activity log", icon: History },
  { id: "upload", label: "Upload", icon: Upload },
] as const;

type SectionId = (typeof sections)[number]["id"];

export function AdminDashboard({
  catalog,
  currentAdminId,
  fileNames,
}: {
  catalog: AdminCatalog;
  currentAdminId: string;
  fileNames: Record<string, string>;
}) {
  const [section, setSection] = useState<SectionId>("analytics");
  const { books, papers, members, monthlyReads, popularResources } = catalog;

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-2xl border border-line bg-white p-3 shadow-sm">
        {sections.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm",
                section === item.id ? "bg-navy text-white" : "text-navy-mid hover:bg-paper",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </aside>
      <div>
        {section === "analytics" ? (
          <AnalyticsPanel
            bookCount={books.length}
            paperCount={papers.length}
            activeMembers={members.filter((member) => {
              if (member.status !== "Active" || !member.isMember || !member.membershipExpiresAt) return false;
              return member.membershipExpiresAt >= new Date().toISOString().slice(0, 10);
            }).length}
            monthlyReads={monthlyReads}
            popularResources={popularResources}
          />
        ) : null}
        {section === "books" ? <BooksTable books={books} fileNames={fileNames} /> : null}
        {section === "papers" ? <PapersTable papers={papers} fileNames={fileNames} /> : null}
        {section === "users" ? <UsersTable members={members} currentAdminId={currentAdminId} /> : null}
        {section === "review" ? (
          <ReviewPanel books={books} papers={papers} members={members} fileNames={fileNames} />
        ) : null}
        {section === "activity" ? <ActivityPanel entries={catalog.recentActivity} /> : null}
        {section === "upload" ? <UploadForm /> : null}
      </div>
    </div>
  );
}

function ActivityPanel({ entries }: { entries: AdminCatalog["recentActivity"] }) {
  return (
    <Panel title="Recent activity">
      {entries.length === 0 ? (
        <p className="text-sm text-muted">No activity has been recorded yet.</p>
      ) : (
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="pb-3 pr-4 font-medium">When</th>
              <th className="pb-3 pr-4 font-medium">Who</th>
              <th className="pb-3 pr-4 font-medium">Activity</th>
              <th className="pb-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {entries.map((entry, index) => (
              <tr key={`${entry.createdAt}-${entry.actorId ?? "guest"}-${index}`}>
                <td className="whitespace-nowrap py-3 pr-4 text-muted">{formatActivityDate(entry.createdAt)}</td>
                <td className="py-3 pr-4 font-medium text-navy">{entry.actorName}</td>
                <td className="py-3 pr-4 text-navy-mid">{activityLabel(entry.action)}</td>
                <td className="py-3 text-muted">
                  {entry.detail}
                  {entry.targetKind ? (
                    <span className="ml-2 text-xs capitalize">
                      · {entry.targetKind}{entry.targetId ? ` (${entry.targetId})` : ""}
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

function activityLabel(action: string) {
  const labels: Record<string, string> = {
    "auth.registered": "Registered",
    "auth.signed_in": "Signed in",
    "auth.signed_out": "Signed out",
    "resource.read": "Read resource",
    "resource.rated": "Rated resource",
    "library.saved_added": "Saved resource",
    "library.saved_removed": "Removed saved resource",
    "library.favorites_added": "Favorited resource",
    "library.favorites_removed": "Removed favorite",
    "membership.purchased": "Membership started or renewed",
    "membership.cancelled": "Membership cancelled",
    "author.resource_submitted": "Submission received",
    "author.resource_resubmitted": "Submission resubmitted",
    "author.revision_submitted": "Revision submitted",
    "author.revision_cancelled": "Revision cancelled",
    "author.resource_withdrawn": "Submission withdrawn",
    "author.resource_deleted": "Submission deleted",
    "resource.created": "Resource added",
    "resource.published": "Resource published",
    "resource.rejected": "Resource rejected",
    "resource.updated": "Resource edited",
    "resource.deleted": "Resource deleted",
    "member.membership_granted": "Membership granted",
    "member.author_granted": "Author access granted",
    "member.author_removed": "Author access removed",
    "member.admin_granted": "Admin access granted",
    "member.admin_removed": "Admin access removed",
    "member.suspended": "Member suspended",
    "member.unsuspended": "Member restored",
  };
  return labels[action] ?? action.replace(/[._]/g, " ");
}

function formatActivityDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function AnalyticsPanel({
  bookCount,
  paperCount,
  activeMembers,
  monthlyReads,
  popularResources,
}: {
  bookCount: number;
  paperCount: number;
  activeMembers: number;
  monthlyReads: AdminCatalog["monthlyReads"];
  popularResources: AdminCatalog["popularResources"];
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Books in catalog" value={formatNumber(bookCount)} />
        <Stat label="Research papers" value={formatNumber(paperCount)} />
        <Stat label="Active members" value={formatNumber(activeMembers)} />
      </div>
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="font-serif text-xl text-navy">Reads over time</h3>
        {monthlyReads.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No reads recorded yet.</p>
        ) : (
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyReads}>
                <CartesianGrid stroke="#35373a" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#a1a1a1", fontSize: 12 }} />
                <YAxis tick={{ fill: "#a1a1a1", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#1b1c1f", borderColor: "#35373a", color: "#f3f3f1" }} />
                <Legend />
                <Line type="monotone" dataKey="books" stroke="#e50914" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="papers" stroke="#52d6c8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="font-serif text-xl text-navy">Popular resources</h3>
        {popularResources.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No titles have been read yet.</p>
        ) : (
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularResources} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid stroke="#35373a" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#a1a1a1", fontSize: 12 }} />
                <YAxis type="category" dataKey="title" width={180} tick={{ fill: "#d0d0d0", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#1b1c1f", borderColor: "#35373a", color: "#f3f3f1" }} />
                <Bar dataKey="reads" fill="#e50914" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function BooksTable({ books, fileNames }: { books: AdminCatalog["books"]; fileNames: Record<string, string> }) {
  const [query, setQuery] = useState("");
  const filtered = books.filter((book) => {
    const haystack = `${book.title} ${book.author}`.toLowerCase();
    return !query.trim() || haystack.includes(query.trim().toLowerCase());
  });

  return (
    <Panel title="Books">
      <label className="mb-4 block text-xs font-semibold tracking-wide text-muted uppercase">
        Search titles
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by title or author"
          className="mt-1.5 w-full max-w-md rounded-lg border border-line px-3 py-2 text-sm font-normal text-ink outline-none focus:border-navy-soft"
        />
      </label>
      <table className="w-full text-left text-sm">
        <thead className="text-xs tracking-wide text-muted uppercase">
          <tr>
            <th className="py-2">Title</th>
            <th>Author</th>
            <th>Year</th>
            <th>Access</th>
            <th>Status</th>
            <th>Reads</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((book) => {
            const initial: ResourceFormValues = {
              title: book.title,
              author: book.author,
              isbn: book.isbn,
              category: book.category,
              publisher: book.publisher,
              language: book.language,
              pages: book.pages,
              year: book.year,
              access: book.access,
              description: book.description,
              publicationStatus: book.publicationStatus ?? "published",
              currentFileName: book.fileId ? (fileNames[book.fileId] ?? "") : null,
              hasCover: Boolean(book.coverId),
            };
            return (
              <CatalogAdminRow
                key={book._id}
                kind="book"
                id={book._id}
                title={book.title}
                initial={initial}
              >
                <td className="py-3 font-medium text-navy">{book.title}</td>
                <td>{book.author}</td>
                <td>{book.year}</td>
                <td><AccessChip access={book.access} /></td>
                <td>{statusLabel(book.publicationStatus)}</td>
                <td>{formatNumber(book.reads)}</td>
              </CatalogAdminRow>
            );
          })}
        </tbody>
      </table>
      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          {books.length === 0 ? "No books in the catalog yet." : "No books match this search."}
        </p>
      ) : null}
    </Panel>
  );
}

function PapersTable({
  papers,
  fileNames,
}: {
  papers: AdminCatalog["papers"];
  fileNames: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const filtered = papers.filter((paper) => {
    const haystack = `${paper.title} ${paper.authors.join(" ")} ${paper.field}`.toLowerCase();
    return !query.trim() || haystack.includes(query.trim().toLowerCase());
  });

  return (
    <Panel title="Research papers">
      <label className="mb-4 block text-xs font-semibold tracking-wide text-muted uppercase">
        Search titles
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by title, author, or field"
          className="mt-1.5 w-full max-w-md rounded-lg border border-line px-3 py-2 text-sm font-normal text-ink outline-none focus:border-navy-soft"
        />
      </label>
      <table className="w-full text-left text-sm">
        <thead className="text-xs tracking-wide text-muted uppercase">
          <tr>
            <th className="py-2">Title</th>
            <th>Field</th>
            <th>Year</th>
            <th>Status</th>
            <th>Citations</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((paper) => {
            const initial: ResourceFormValues = {
              title: paper.title,
              authors: paper.authors.join(", "),
              doi: paper.doi,
              field: paper.field,
              venue: paper.venue,
              venueType: paper.venueType,
              pages: paper.pages,
              keywords: paper.keywords.join(", "),
              citations: paper.citations,
              year: paper.year,
              access: paper.access,
              description: paper.abstract,
              publicationStatus: paper.publicationStatus ?? "published",
              currentFileName: paper.fileId ? (fileNames[paper.fileId] ?? "") : null,
              hasCover: Boolean(paper.coverId),
            };
            return (
              <CatalogAdminRow
                key={paper._id}
                kind="paper"
                id={paper._id}
                title={paper.title}
                initial={initial}
              >
                <td className="max-w-md py-3 font-medium text-navy">{paper.title}</td>
                <td>{paper.field}</td>
                <td>{paper.year}</td>
                <td>{statusLabel(paper.publicationStatus)}</td>
                <td>{formatNumber(paper.citations)}</td>
              </CatalogAdminRow>
            );
          })}
        </tbody>
      </table>
      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          {papers.length === 0 ? "No papers in the catalog yet." : "No papers match this search."}
        </p>
      ) : null}
    </Panel>
  );
}

function CatalogAdminRow({
  kind,
  id,
  title,
  initial,
  children,
}: {
  kind: "book" | "paper";
  id: string;
  title: string;
  initial: ResourceFormValues;
  children: ReactNode;
}) {
  const [deleteState, deleteAction, deleting] = useActionState(deleteResourceAction, {});
  const editDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (deleteState.success) deleteDialogRef.current?.close();
  }, [deleteState.success]);

  return (
    <>
      <tr className="border-t border-line align-top">
        {children}
        <td className="py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => editDialogRef.current?.showModal()}
              aria-haspopup="dialog"
              aria-label={`Edit ${title}`}
              title="Edit resource"
              className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1.5 text-xs font-medium text-navy hover:bg-paper"
            >
              <Pencil className="size-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => deleteDialogRef.current?.showModal()}
              aria-haspopup="dialog"
              aria-label={`Delete ${title}`}
              title="Delete resource"
              className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          </div>
          {deleteState.error ? (
            <p role="alert" className="mt-1 max-w-48 text-xs text-red-700">{deleteState.error}</p>
          ) : null}
          <dialog
            ref={editDialogRef}
            onClick={(event) => {
              if (event.target === editDialogRef.current) editDialogRef.current?.close();
            }}
            className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-xl border border-line bg-white p-0 text-ink shadow-2xl backdrop:bg-navy/45 backdrop:backdrop-blur-sm"
            aria-labelledby={`edit-resource-title-${kind}-${id}`}
          >
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-muted uppercase">Edit {kind}</p>
                  <h2 id={`edit-resource-title-${kind}-${id}`} className="mt-1 font-serif text-xl text-navy">
                    {title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => editDialogRef.current?.close()}
                  aria-label="Close edit dialog"
                  className="rounded-full p-2 text-muted hover:bg-paper hover:text-navy"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-5">
                <ResourceForm
                  action={updateResourceAction}
                  submitLabel="Save changes"
                  pendingLabel="Saving…"
                  lockKind={kind}
                  resourceId={id}
                  initial={initial}
                  allowFileUpload
                  allowPublicationStatus
                />
              </div>
            </div>
          </dialog>
          <dialog
            ref={deleteDialogRef}
            onClick={(event) => {
              if (event.target === deleteDialogRef.current && !deleting) {
                deleteDialogRef.current?.close();
              }
            }}
            className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-white p-0 text-ink shadow-2xl backdrop:bg-navy/45 backdrop:backdrop-blur-sm"
            aria-labelledby={`delete-resource-title-${kind}-${id}`}
            aria-describedby={`delete-resource-description-${kind}-${id}`}
          >
            <form action={deleteAction} className="p-5 sm:p-6">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="kind" value={kind} />
              <h2 id={`delete-resource-title-${kind}-${id}`} className="font-serif text-xl text-navy">
                Delete resource?
              </h2>
              <p id={`delete-resource-description-${kind}-${id}`} className="mt-3 text-sm leading-6 text-muted">
                Delete <span className="font-medium text-navy">{title}</span>? This cannot be undone.
              </p>
              {deleteState.error ? (
                <p role="alert" className="mt-3 text-sm text-red-700">{deleteState.error}</p>
              ) : null}
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => deleteDialogRef.current?.close()}
                  disabled={deleting}
                  autoFocus
                  className="min-h-10 rounded-full border border-line px-4 py-2 text-sm font-medium text-navy disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="min-h-10 rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Delete resource"}
                </button>
              </div>
            </form>
          </dialog>
        </td>
      </tr>
    </>
  );
}

function UsersTable({
  members,
  currentAdminId,
}: {
  members: AdminCatalog["members"];
  currentAdminId: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = members.filter((member) => {
    const haystack = `${member.name} ${member.email}`.toLowerCase();
    return !query.trim() || haystack.includes(query.trim().toLowerCase());
  });

  return (
    <Panel title="Members">
      <label className="mb-4 block text-xs font-semibold tracking-wide text-muted uppercase">
        Search members
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by name or email"
          className="mt-1.5 w-full max-w-md rounded-lg border border-line px-3 py-2 text-sm font-normal text-ink outline-none focus:border-navy-soft"
        />
      </label>
      <table className="w-full text-left text-sm">
        <thead className="text-xs tracking-wide text-muted uppercase">
          <tr>
            <th className="py-2">Name</th>
            <th>Membership</th>
            <th>Roles</th>
            <th>Status</th>
            <th>Reads</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((member) => (
            <MemberRow key={member._id} member={member} currentAdminId={currentAdminId} />
          ))}
        </tbody>
      </table>
      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          {members.length === 0 ? "No members yet." : "No members match this search."}
        </p>
      ) : null}
    </Panel>
  );
}

function MemberRow({
  member,
  currentAdminId,
}: {
  member: AdminCatalog["members"][number];
  currentAdminId: string;
}) {
  const [state, formAction, pending] = useActionState(manageMemberAction, {});
  const [operation, setOperation] = useState<MemberOperation | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isSelf = member._id === currentAdminId;
  const today = new Date().toISOString().slice(0, 10);
  const membershipCurrent = Boolean(
    member.isMember && member.membershipExpiresAt && member.membershipExpiresAt >= today,
  );
  const details = operation ? memberOperationDetails[operation] : null;

  function openAction(nextOperation: MemberOperation) {
    setOperation(nextOperation);
    setSubmitted(false);
    dialogRef.current?.showModal();
  }

  return (
    <tr className="border-t border-line align-top">
      <td className="py-3">
        <p className="font-medium text-navy">{member.name}{isSelf ? " (you)" : ""}</p>
        <p className="text-xs text-muted">{member.email}</p>
      </td>
      <td className="py-3">
        <p>{membershipCurrent ? "Member" : "Not a member"}</p>
        {member.membershipExpiresAt ? (
          <p className="text-xs text-muted">Through {member.membershipExpiresAt}</p>
        ) : null}
      </td>
      <td className="py-3 text-xs text-navy-mid">
        {[member.isAdmin ? "Admin" : null, member.isAuthor ? "Author" : null]
          .filter(Boolean)
          .join(", ") || "Reader"}
      </td>
      <td className="py-3">{member.status}</td>
      <td className="py-3">{member.reads}</td>
      <td className="min-w-72 py-3">
        <div className="grid grid-cols-2 gap-2">
          <MemberActionButton
            icon={<CreditCard className="size-4" />}
            label={membershipCurrent ? "Renew membership" : "Grant membership"}
            onClick={() => openAction("membership")}
          />
          <MemberActionButton
            icon={<UserRound className="size-4" />}
            label={member.isAuthor ? "Remove author" : "Make author"}
            onClick={() => openAction(member.isAuthor ? "remove-author" : "make-author")}
          />
          <MemberActionButton
            icon={<Shield className="size-4" />}
            label={member.isAdmin ? "Demote admin" : "Promote admin"}
            onClick={() => openAction(member.isAdmin ? "demote-admin" : "promote-admin")}
            disabled={isSelf && member.isAdmin}
            title={isSelf && member.isAdmin ? "You cannot remove your own admin access" : undefined}
          />
          <MemberActionButton
            icon={member.status === "Suspended"
              ? <RotateCcw className="size-4" />
              : <Ban className="size-4" />}
            label={member.status === "Suspended" ? "Unsuspend" : "Suspend"}
            onClick={() => openAction(member.status === "Suspended" ? "unsuspend" : "suspend")}
            disabled={isSelf && member.status !== "Suspended"}
            danger={member.status !== "Suspended"}
            title={isSelf && member.status !== "Suspended" ? "You cannot suspend your own account" : undefined}
          />
        </div>
        <dialog
          ref={dialogRef}
          onClick={(event) => {
            if (event.target === dialogRef.current && !pending) dialogRef.current?.close();
          }}
          onCancel={(event) => {
            if (pending) event.preventDefault();
          }}
          className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-white p-0 text-ink shadow-2xl backdrop:bg-navy/45 backdrop:backdrop-blur-sm"
          aria-labelledby={`member-action-title-${member._id}`}
          aria-describedby={`member-action-description-${member._id}`}
        >
          <form
            action={formAction}
            onSubmit={() => setSubmitted(true)}
            className="p-5 sm:p-6"
          >
            <input type="hidden" name="memberId" value={member._id} />
            {operation ? <input type="hidden" name="operation" value={operation} /> : null}
            {submitted && !pending ? (
              <>
                <div className="flex items-center gap-3">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${state.error ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"}`}>
                    {state.error
                      ? <TriangleAlert className="size-5" aria-hidden="true" />
                      : <Check className="size-5" aria-hidden="true" />}
                  </span>
                  <h2 id={`member-action-title-${member._id}`} className="font-serif text-xl text-navy">
                    {state.error ? "Action not completed" : "Action completed"}
                  </h2>
                </div>
                <p
                  id={`member-action-description-${member._id}`}
                  role={state.error ? "alert" : "status"}
                  className="mt-4 text-sm leading-6 text-muted"
                >
                  {state.error ?? state.success ?? "The member action could not be completed."}
                </p>
                <div className="mt-6 flex justify-end gap-2">
                  {state.error ? (
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="min-h-10 rounded-full border border-line px-4 py-2 text-sm font-medium text-navy"
                    >
                      Try again
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => dialogRef.current?.close()}
                    autoFocus
                    className="min-h-10 rounded-full bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-mid"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 pr-8">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${details?.danger ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-paper text-navy ring-1 ring-line"}`}>
                    {details?.danger
                      ? <TriangleAlert className="size-5" aria-hidden="true" />
                      : details?.icon}
                  </span>
                  <h2 id={`member-action-title-${member._id}`} className="font-serif text-xl text-navy">
                    {details?.title ?? "Confirm member action"}
                  </h2>
                </div>
                <p id={`member-action-description-${member._id}`} className="mt-4 text-sm leading-6 text-muted">
                  {details?.description} <span className="font-medium text-navy">{member.name}</span> ({member.email})?
                </p>
                {pending ? (
                  <p role="status" className="mt-4 flex items-center gap-2 text-sm text-navy-mid">
                    <LoaderCircle className="size-4 animate-spin" />
                    Updating member access…
                  </p>
                ) : null}
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => dialogRef.current?.close()}
                    disabled={pending}
                    autoFocus
                    className="min-h-10 rounded-full border border-line px-4 py-2 text-sm font-medium text-navy disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending || !operation}
                    className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${details?.danger ? "bg-red-700 hover:bg-red-800" : "bg-navy hover:bg-navy-mid"}`}
                  >
                    {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
                    {pending ? "Working…" : details?.confirmLabel ?? "Confirm"}
                  </button>
                </div>
              </>
            )}
          </form>
        </dialog>
      </td>
    </tr>
  );
}

type MemberOperation =
  | "membership"
  | "make-author"
  | "remove-author"
  | "promote-admin"
  | "demote-admin"
  | "suspend"
  | "unsuspend";

const memberOperationDetails: Record<
  MemberOperation,
  { title: string; description: string; confirmLabel: string; danger: boolean; icon: ReactNode }
> = {
  membership: {
    title: "Grant or renew membership?",
    description: "This will provide 30 days of membership access for",
    confirmLabel: "Grant membership",
    danger: false,
    icon: <CreditCard className="size-5" aria-hidden="true" />,
  },
  "make-author": {
    title: "Grant author access?",
    description: "This will let this account submit books and papers as an author:",
    confirmLabel: "Make author",
    danger: false,
    icon: <UserRound className="size-5" aria-hidden="true" />,
  },
  "remove-author": {
    title: "Remove author access?",
    description: "This account will no longer be able to submit resources as an author:",
    confirmLabel: "Remove author",
    danger: true,
    icon: <UserRound className="size-5" aria-hidden="true" />,
  },
  "promote-admin": {
    title: "Promote to admin?",
    description: "This account will receive administrative access to the library:",
    confirmLabel: "Promote to admin",
    danger: false,
    icon: <Shield className="size-5" aria-hidden="true" />,
  },
  "demote-admin": {
    title: "Remove admin access?",
    description: "This account will lose administrative access to the library:",
    confirmLabel: "Demote admin",
    danger: true,
    icon: <Shield className="size-5" aria-hidden="true" />,
  },
  suspend: {
    title: "Suspend this account?",
    description: "This account will be blocked from signing in:",
    confirmLabel: "Suspend account",
    danger: true,
    icon: <Ban className="size-5" aria-hidden="true" />,
  },
  unsuspend: {
    title: "Restore account access?",
    description: "This account will be able to sign in again:",
    confirmLabel: "Unsuspend account",
    danger: false,
    icon: <RotateCcw className="size-5" aria-hidden="true" />,
  },
};

function MemberActionButton({
  icon,
  label,
  onClick,
  disabled,
  danger = false,
  title,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex min-h-10 items-center justify-start gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${danger ? "border-red-200 text-red-700 hover:bg-red-50" : "border-line text-navy hover:bg-paper"}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function UploadForm() {
  return (
    <Panel title="Add a resource">
      <p className="mb-5 text-sm text-muted">
        Add a book or paper to the catalog. It is published immediately. Uploaded files are prepared for
        in-browser reading.
      </p>
      <ResourceForm
        action={createResourceAction}
        submitLabel="Save to catalog"
        allowFileUpload
      />
    </Panel>
  );
}

type ReviewCopy = {
  title: string;
  byline: string;
  year: string;
  subject: string;
  access: string;
  description: string;
  fileHref?: string;
  fileName?: string;
  coverHref?: string;
  keepsFile?: boolean;
  keepsCover?: boolean;
  aiSummary?: string;
};

type ReviewItem = {
  id: string;
  kind: "book" | "paper";
  mode: "submission" | "revision";
  title: string;
  addedAt: string;
  submittedBy?: string;
  proposed: ReviewCopy;
  live?: ReviewCopy;
};

function ReviewPanel({
  books,
  papers,
  members,
  fileNames,
}: {
  books: AdminCatalog["books"];
  papers: AdminCatalog["papers"];
  members: AdminCatalog["members"];
  fileNames: Record<string, string>;
}) {
  const names = new Map(members.map((member) => [member._id, member.name]));
  const pending: ReviewItem[] = [
    ...books.flatMap((book) => bookReviews(book, fileNames)),
    ...papers.flatMap((paper) => paperReviews(paper, fileNames)),
  ].sort((a, b) => b.addedAt.localeCompare(a.addedAt));

  return (
    <Panel title="Waiting for review">
      {pending.length === 0 ? (
        <p className="text-sm text-muted">No submissions are waiting for review.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.map((item) => (
            <ReviewRow
              key={`${item.mode}-${item.kind}-${item.id}`}
              item={item}
              submitter={item.submittedBy ? names.get(item.submittedBy) ?? "Unknown" : "Unknown"}
            />
          ))}
        </div>
      )}
    </Panel>
  );
}

function bookReviews(book: Book, fileNames: Record<string, string>): ReviewItem[] {
  const items: ReviewItem[] = [];
  if (book.publicationStatus === "pending") {
    items.push({
      id: book._id,
      kind: "book",
      mode: "submission",
      title: book.title,
      addedAt: book.addedAt,
      submittedBy: book.submittedBy,
      proposed: {
        title: book.title,
        byline: book.author,
        year: String(book.year),
        subject: book.category,
        access: book.access === "members" ? "Members only" : "Open access",
        description: book.description,
        fileHref: book.fileId ? `/api/books/${book._id}/file` : undefined,
        fileName: book.fileId ? fileNames[book.fileId] : undefined,
        coverHref: book.coverId ? `/api/books/${book._id}/cover` : undefined,
        aiSummary: book.aiSummary,
      },
    });
  }
  if (book.revision?.status === "pending") {
    const revision = book.revision;
    items.push({
      id: book._id,
      kind: "book",
      mode: "revision",
      title: revision.title,
      addedAt: revision.submittedAt,
      submittedBy: book.submittedBy,
      live: {
        title: book.title,
        byline: book.author,
        year: String(book.year),
        subject: book.category,
        access: book.access === "members" ? "Members only" : "Open access",
        description: book.description,
        fileHref: book.fileId ? `/api/books/${book._id}/file` : undefined,
        fileName: book.fileId ? fileNames[book.fileId] : undefined,
        coverHref: book.coverId ? `/api/books/${book._id}/cover` : undefined,
      },
      proposed: {
        title: revision.title,
        byline: revision.author,
        year: String(revision.year),
        subject: revision.category,
        access: revision.access === "members" ? "Members only" : "Open access",
        description: revision.description,
        fileHref: revision.fileId ? `/api/books/${book._id}/file?revision=1` : undefined,
        fileName: revision.fileId ? fileNames[revision.fileId] : undefined,
        coverHref: revision.coverId ? `/api/books/${book._id}/cover?revision=1` : undefined,
        keepsFile: !revision.fileId,
        keepsCover: !revision.coverId,
        aiSummary: revision.aiSummary,
      },
    });
  }
  return items;
}

function paperReviews(paper: ResearchPaper, fileNames: Record<string, string>): ReviewItem[] {
  const items: ReviewItem[] = [];
  if (paper.publicationStatus === "pending") {
    items.push({
      id: paper._id,
      kind: "paper",
      mode: "submission",
      title: paper.title,
      addedAt: paper.addedAt,
      submittedBy: paper.submittedBy,
      proposed: {
        title: paper.title,
        byline: paper.authors.join(", "),
        year: String(paper.year),
        subject: paper.field,
        access: paper.access === "members" ? "Members only" : "Open access",
        description: paper.abstract,
        fileHref: paper.fileId ? `/api/research/${paper._id}/file` : undefined,
        fileName: paper.fileId ? fileNames[paper.fileId] : undefined,
        coverHref: paper.coverId ? `/api/research/${paper._id}/cover` : undefined,
        aiSummary: paper.aiSummary,
      },
    });
  }
  if (paper.revision?.status === "pending") {
    const revision = paper.revision;
    items.push({
      id: paper._id,
      kind: "paper",
      mode: "revision",
      title: revision.title,
      addedAt: revision.submittedAt,
      submittedBy: paper.submittedBy,
      live: {
        title: paper.title,
        byline: paper.authors.join(", "),
        year: String(paper.year),
        subject: paper.field,
        access: paper.access === "members" ? "Members only" : "Open access",
        description: paper.abstract,
        fileHref: paper.fileId ? `/api/research/${paper._id}/file` : undefined,
        fileName: paper.fileId ? fileNames[paper.fileId] : undefined,
        coverHref: paper.coverId ? `/api/research/${paper._id}/cover` : undefined,
      },
      proposed: {
        title: revision.title,
        byline: revision.authors.join(", "),
        year: String(revision.year),
        subject: revision.field,
        access: revision.access === "members" ? "Members only" : "Open access",
        description: revision.abstract,
        fileHref: revision.fileId ? `/api/research/${paper._id}/file?revision=1` : undefined,
        fileName: revision.fileId ? fileNames[revision.fileId] : undefined,
        coverHref: revision.coverId ? `/api/research/${paper._id}/cover?revision=1` : undefined,
        keepsFile: !revision.fileId,
        keepsCover: !revision.coverId,
        aiSummary: revision.aiSummary,
      },
    });
  }
  return items;
}

function splitAiSummary(summary?: string) {
  const text = summary?.trim() ?? "";
  if (!text) return { prose: "", subjects: [] as string[] };
  const match = text.match(/\n?\s*Subjects:\s*(.+)$/i);
  if (!match || match.index === undefined) return { prose: text, subjects: [] as string[] };
  const subjects = match[1]
    .split(/[,;]/)
    .map((subject) => subject.replace(/\.$/, "").trim())
    .filter(Boolean);
  return { prose: text.slice(0, match.index).trim(), subjects };
}

function ReviewRow({ item, submitter }: { item: ReviewItem; submitter: string }) {
  const [publishState, publish, publishing] = useActionState(publishResourceAction, {});
  const [rejectState, reject, rejecting] = useActionState(rejectResourceAction, {});
  const message = publishState.error ?? rejectState.error ?? publishState.success ?? rejectState.success;
  const summary = splitAiSummary(item.proposed.aiSummary);
  const fileHref = item.proposed.fileHref;

  return (
    <article className="rounded-2xl border border-line bg-paper/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-serif text-lg text-navy">{item.title}</h4>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-navy-mid capitalize ring-1 ring-line">
              {item.kind}
            </span>
            {item.mode === "revision" ? (
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-navy-soft uppercase ring-1 ring-line">
                New version
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted">Submitted by {submitter}</p>
        </div>
        <p className="text-sm text-muted">{item.addedAt}</p>
      </div>

      <section className="mt-4">
        <h5 className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">AI summary</h5>
        {summary.prose ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 whitespace-pre-line text-muted">{summary.prose}</p>
        ) : summary.subjects.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No AI summary yet.</p>
        ) : null}
        {summary.subjects.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {summary.subjects.map((subject) => (
              <li
                key={subject}
                className="rounded-full bg-white px-2.5 py-1 text-[11px] text-navy-mid ring-1 ring-line"
              >
                {subject}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-navy">Review submission</summary>
        <div className={item.live ? "mt-3 grid gap-4 lg:grid-cols-2" : "mt-3"}>
          {item.live ? <ReviewCopyView label="Published now" copy={item.live} /> : null}
          <ReviewCopyView label={item.live ? "Proposed version" : "Submission"} copy={item.proposed} />
        </div>
      </details>

      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {fileHref ? (
            <a
              href={fileHref}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-navy underline"
            >
              Preview PDF{item.proposed.fileName ? ` (${item.proposed.fileName})` : ""}
            </a>
          ) : item.proposed.keepsFile ? (
            <p className="text-sm text-muted">Keeps the current PDF.</p>
          ) : (
            <p className="text-sm text-muted">No PDF attached.</p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <form action={publish}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="kind" value={item.kind} />
              <button
                type="submit"
                disabled={publishing || rejecting}
                className="rounded-full bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-mid disabled:opacity-60"
              >
                {publishing ? "Publishing…" : "Publish"}
              </button>
            </form>
            <form action={reject} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="kind" value={item.kind} />
              <input
                name="reviewNote"
                required
                maxLength={280}
                placeholder="Note for the author"
                className="w-56 rounded-lg border border-line bg-white px-2 py-1.5 text-xs font-normal text-ink outline-none"
              />
              <button
                type="submit"
                disabled={publishing || rejecting}
                className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-paper disabled:opacity-60"
              >
                {rejecting ? "Rejecting…" : "Reject"}
              </button>
            </form>
          </div>
          {message ? <p className="max-w-sm text-xs text-navy-mid">{message}</p> : null}
        </div>
      </div>
    </article>
  );
}

function ReviewCopyView({ label, copy }: { label: string; copy: ReviewCopy }) {
  return (
    <div className="rounded-xl border border-line bg-paper/40 p-3 font-normal">
      <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</p>
      {copy.coverHref ? (
        <img src={copy.coverHref} alt="" className="mt-3 h-28 w-20 rounded-sm object-cover" />
      ) : copy.keepsCover ? (
        <p className="mt-3 text-xs text-muted">Keeps the current cover.</p>
      ) : (
        <p className="mt-3 text-xs text-muted">No cover image.</p>
      )}
      <p className="mt-3 text-navy">{copy.title}</p>
      <p className="mt-1 text-sm text-navy-mid">{copy.byline}</p>
      <p className="mt-2 text-xs text-muted">
        {copy.year} · {copy.subject} · {copy.access}
      </p>
      <p className="mt-2 text-sm leading-6 whitespace-pre-line text-muted">{copy.description}</p>
      {copy.fileHref ? (
        <a href={copy.fileHref} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-navy underline">
          Preview PDF{copy.fileName ? ` (${copy.fileName})` : ""}
        </a>
      ) : copy.keepsFile ? (
        <p className="mt-2 text-xs text-muted">Keeps the current PDF.</p>
      ) : (
        <p className="mt-2 text-xs text-muted">No PDF attached.</p>
      )}
    </div>
  );
}

function statusLabel(status?: PublicationStatus) {
  if (status === "pending") return "Pending";
  if (status === "rejected") return "Rejected";
  if (status === "withdrawn") return "Withdrawn";
  return "Published";
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-serif text-xl text-navy">{title}</h3>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-2 font-serif text-3xl text-navy">{value}</p>
    </div>
  );
}

function AccessChip({ access }: { access: AccessType }) {
  return (
    <span className="text-xs text-navy-mid">
      {access === "open" ? "Open Access" : "Members only"}
    </span>
  );
}
