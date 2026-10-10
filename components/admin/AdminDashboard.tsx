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
import type { AccessType, AdminCatalog, PublicationStatus } from "@/lib/types";

const sections = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "books", label: "Manage books", icon: BookOpen },
  { id: "papers", label: "Manage papers", icon: FileText },
  { id: "users", label: "Users", icon: Users },
  { id: "review", label: "Review", icon: ClipboardCheck },
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
            activeMembers={members.filter((member) => member.status === "Active").length}
            monthlyReads={monthlyReads}
            popularResources={popularResources}
          />
        ) : null}
        {section === "books" ? <BooksTable books={books} fileNames={fileNames} /> : null}
        {section === "papers" ? <PapersTable papers={papers} fileNames={fileNames} /> : null}
        {section === "users" ? <UsersTable members={members} currentAdminId={currentAdminId} /> : null}
        {section === "review" ? (
          <ReviewPanel books={books} papers={papers} members={members} />
        ) : null}
        {section === "upload" ? <UploadForm /> : null}
      </div>
    </div>
  );
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
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyReads}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#5b6778", fontSize: 12 }} />
              <YAxis tick={{ fill: "#5b6778", fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="books" stroke="#0b1f3a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="papers" stroke="#2c5282" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="font-serif text-xl text-navy">Popular resources</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={popularResources} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#5b6778", fontSize: 12 }} />
              <YAxis type="category" dataKey="title" width={180} tick={{ fill: "#1a2332", fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="reads" fill="#1b365d" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function BooksTable({ books, fileNames }: { books: AdminCatalog["books"]; fileNames: Record<string, string> }) {
  return (
    <Panel title="Books">
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
          {books.map((book) => {
            const initial: ResourceFormValues = {
              title: book.title,
              author: book.author,
              isbn: book.isbn,
              category: book.category,
              year: book.year,
              access: book.access,
              description: book.description,
              publicationStatus: book.publicationStatus ?? "published",
              currentFileName: book.fileId ? (fileNames[book.fileId] ?? "") : null,
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
  return (
    <Panel title="Research papers">
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
          {papers.map((paper) => {
            const initial: ResourceFormValues = {
              title: paper.title,
              authors: paper.authors.join(", "),
              doi: paper.doi,
              field: paper.field,
              year: paper.year,
              access: paper.access,
              description: paper.abstract,
              publicationStatus: paper.publicationStatus ?? "published",
              currentFileName: paper.fileId ? (fileNames[paper.fileId] ?? "") : null,
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
  return (
    <Panel title="Members">
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
          {members.map((member) => (
            <MemberRow key={member._id} member={member} currentAdminId={currentAdminId} />
          ))}
        </tbody>
      </table>
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

type PendingItem = {
  id: string;
  kind: "book" | "paper";
  title: string;
  addedAt: string;
  submittedBy?: string;
  hasFile: boolean;
};

function ReviewPanel({
  books,
  papers,
  members,
}: {
  books: AdminCatalog["books"];
  papers: AdminCatalog["papers"];
  members: AdminCatalog["members"];
}) {
  const names = new Map(members.map((member) => [member._id, member.name]));
  const pending: PendingItem[] = [
    ...books
      .filter((book) => book.publicationStatus === "pending")
      .map((book) => ({
        id: book._id,
        kind: "book" as const,
        title: book.title,
        addedAt: book.addedAt,
        submittedBy: book.submittedBy,
        hasFile: Boolean(book.fileId),
      })),
    ...papers
      .filter((paper) => paper.publicationStatus === "pending")
      .map((paper) => ({
        id: paper._id,
        kind: "paper" as const,
        title: paper.title,
        addedAt: paper.addedAt,
        submittedBy: paper.submittedBy,
        hasFile: Boolean(paper.fileId),
      })),
  ].sort((a, b) => b.addedAt.localeCompare(a.addedAt));

  return (
    <Panel title="Waiting for review">
      {pending.length === 0 ? (
        <p className="text-sm text-muted">No submissions are waiting for review.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="py-2">Title</th>
              <th>Kind</th>
              <th>Submitted by</th>
              <th>Date</th>
              <th>Decision</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((item) => (
              <ReviewRow
                key={`${item.kind}-${item.id}`}
                item={item}
                submitter={item.submittedBy ? names.get(item.submittedBy) ?? "Unknown" : "Unknown"}
              />
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

function ReviewRow({ item, submitter }: { item: PendingItem; submitter: string }) {
  const [publishState, publish, publishing] = useActionState(publishResourceAction, {});
  const [rejectState, reject, rejecting] = useActionState(rejectResourceAction, {});
  const message = publishState.error ?? rejectState.error ?? publishState.success ?? rejectState.success;

  return (
    <tr className="border-t border-line align-top">
      <td className="max-w-sm py-3 font-medium text-navy">
        {item.title}
        {item.hasFile ? (
          <a
            href={item.kind === "book" ? `/api/books/${item.id}/file` : `/api/research/${item.id}/file`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-sm font-medium text-navy underline"
          >
            Preview PDF
          </a>
        ) : null}
      </td>
      <td className="py-3 capitalize">{item.kind}</td>
      <td className="py-3">{submitter}</td>
      <td className="py-3">{item.addedAt}</td>
      <td className="py-3">
        <div className="flex flex-col gap-2">
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
          <form action={reject} className="flex flex-col gap-2">
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="kind" value={item.kind} />
            <input
              name="reviewNote"
              required
              maxLength={280}
              placeholder="Note for the author"
              className="w-56 rounded-lg border border-line px-2 py-1.5 text-xs font-normal text-ink outline-none"
            />
            <button
              type="submit"
              disabled={publishing || rejecting}
              className="w-fit rounded-full border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-paper disabled:opacity-60"
            >
              {rejecting ? "Rejecting…" : "Reject"}
            </button>
          </form>
          {message ? <p className="max-w-56 text-xs text-navy-mid">{message}</p> : null}
        </div>
      </td>
    </tr>
  );
}

function statusLabel(status?: PublicationStatus) {
  if (status === "pending") return "Pending";
  if (status === "rejected") return "Rejected";
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
