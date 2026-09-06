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
  FileText,
  Upload,
  Users,
} from "lucide-react";
import { createResourceAction, type AuthState } from "@/app/actions/auth";
import { cn, formatNumber } from "@/lib/format";
import type { AccessType, AdminCatalog } from "@/lib/types";

const sections = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "books", label: "Manage books", icon: BookOpen },
  { id: "papers", label: "Manage papers", icon: FileText },
  { id: "users", label: "Users", icon: Users },
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
            <th>Citations</th>
          </tr>
        </thead>
        <tbody>
          {papers.map((paper) => (
            <tr key={paper._id} className="border-t border-line">
              <td className="max-w-md py-3 font-medium text-navy">{paper.title}</td>
              <td>{paper.field}</td>
              <td>{paper.year}</td>
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
  const [kind, setKind] = useState<"book" | "paper">("book");
  const [state, action, pending] = useActionState(createResourceAction, {} as AuthState);

  return (
    <Panel title="Add a resource">
      <p className="mb-5 text-sm text-muted">
        Add a book or paper to the catalog. Uploaded files are prepared for
        in-browser reading.
      </p>
      <div className="mb-4 flex gap-2">
        {(["book", "paper"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setKind(item)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm capitalize",
              kind === item ? "bg-navy text-white" : "bg-paper text-navy-mid",
            )}
          >
            {item}
          </button>
        ))}
      </div>
      <form action={action} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="kind" value={kind} />
        <label className="sm:col-span-2 rounded-2xl border border-dashed border-navy/30 bg-paper px-6 py-10 text-center">
          <Upload className="mx-auto size-6 text-navy-soft" />
          <p className="mt-2 text-sm text-navy">Drop a manuscript or choose a file</p>
          <p className="text-xs text-muted">PDF for in-browser reading</p>
          <input type="file" className="sr-only" />
        </label>
        <Field label="Title" name="title" />
        {kind === "book" ? (
          <Field label="Author" name="author" />
        ) : (
          <Field label="Authors" name="authors" />
        )}
        {kind === "book" ? <Field label="ISBN" name="isbn" /> : <Field label="DOI" name="doi" />}
        {kind === "book" ? (
          <Field label="Category" name="category" />
        ) : (
          <Field label="Research field" name="field" />
        )}
        <Field label="Year" name="year" />
        <label className="text-xs font-semibold tracking-wide text-muted uppercase">
          Access
          <select
            name="access"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal text-ink"
          >
            <option value="open">Open Access</option>
            <option value="members">Members only</option>
          </select>
        </label>
        <label className="sm:col-span-2 text-xs font-semibold tracking-wide text-muted uppercase">
          Description / abstract
          <textarea
            name="description"
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
          {pending ? "Saving…" : "Save to catalog"}
        </button>
      </form>
    </Panel>
  );
}

function Field({ label, name }: { label: string; name: string }) {
  return (
    <label className="text-xs font-semibold tracking-wide text-muted uppercase">
      {label}
      <input
        name={name}
        className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm font-normal text-ink outline-none"
      />
    </label>
  );
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
