"use client";

import { useActionState, useState, type ReactNode } from "react";
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
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileText,
  Upload,
  Users,
} from "lucide-react";
import { createResourceAction, publishResourceAction, rejectResourceAction } from "@/app/actions/admin";
import { ResourceForm } from "@/components/catalog/ResourceForm";
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

export function AdminDashboard({ catalog }: { catalog: AdminCatalog }) {
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
        {section === "books" ? <BooksTable books={books} /> : null}
        {section === "papers" ? <PapersTable papers={papers} /> : null}
        {section === "users" ? <UsersTable members={members} /> : null}
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

function BooksTable({ books }: { books: AdminCatalog["books"] }) {
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
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book._id} className="border-t border-line">
              <td className="py-3 font-medium text-navy">{book.title}</td>
              <td>{book.author}</td>
              <td>{book.year}</td>
              <td><AccessChip access={book.access} /></td>
              <td>{statusLabel(book.publicationStatus)}</td>
              <td>{formatNumber(book.reads)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function PapersTable({ papers }: { papers: AdminCatalog["papers"] }) {
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
          </tr>
        </thead>
        <tbody>
          {papers.map((paper) => (
            <tr key={paper._id} className="border-t border-line">
              <td className="max-w-md py-3 font-medium text-navy">{paper.title}</td>
              <td>{paper.field}</td>
              <td>{paper.year}</td>
              <td>{statusLabel(paper.publicationStatus)}</td>
              <td>{formatNumber(paper.citations)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function UsersTable({ members }: { members: AdminCatalog["members"] }) {
  return (
    <Panel title="Members">
      <table className="w-full text-left text-sm">
        <thead className="text-xs tracking-wide text-muted uppercase">
          <tr>
            <th className="py-2">Name</th>
            <th>Membership</th>
            <th>Status</th>
            <th>Reads</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member._id} className="border-t border-line">
              <td className="py-3">
                <p className="font-medium text-navy">{member.name}</p>
                <p className="text-xs text-muted">{member.email}</p>
              </td>
              <td>{member.isMember ? "Member" : "Not a member"}</td>
              <td>{member.status}</td>
              <td>{member.reads}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
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
        showFileStub
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
      })),
    ...papers
      .filter((paper) => paper.publicationStatus === "pending")
      .map((paper) => ({
        id: paper._id,
        kind: "paper" as const,
        title: paper.title,
        addedAt: paper.addedAt,
        submittedBy: paper.submittedBy,
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
      <td className="max-w-sm py-3 font-medium text-navy">{item.title}</td>
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
