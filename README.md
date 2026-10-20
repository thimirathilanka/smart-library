# Nextgen Digital Library

Online catalog for books and research papers. Read PDFs in the browser. Data lives in MongoDB Atlas. Members sign in with email and password.

## Setup

1. Create a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster. Add a database user and allow your IP (or `0.0.0.0/0` for local development).
2. Copy environment variables:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

3. Set in `.env.local`:

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Atlas connection string (`mongodb+srv://...`) |
| `MONGODB_DB` | No | Defaults to `nextgen-library` |
| `AUTH_SECRET` | Yes | Long random string. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `AUTH_URL` | Yes | App URL, e.g. `http://localhost:3000` |
| `ADMIN_NAME` | For first admin | Display name (max 160 characters) |
| `ADMIN_EMAIL` | For first admin | Valid email. If the account already exists, seed leaves it unchanged |
| `ADMIN_PASSWORD` | For first admin | At least 8 characters. The seeded admin is an active member |
| `GEMINI_API_KEY` | No | Free key from [Google AI Studio](https://aistudio.google.com/apikey). Used to draft a short summary and subject phrases when a book or paper is submitted or saved for review. Catalog search matches that text after publish. If the key is missing or the request fails, the item still goes to review without a summary |

Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` together, or leave all three empty. Partial values cause seed to fail.

4. Install, set up the database, and run:

```bash
npm install
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run seed` creates indexes and, when the admin variables are set, the first admin. It does not load a catalog. If this database was seeded with the old sample books, papers, and members, run `npm run seed:reset` once. That removes only those sample records and their stored PDFs. Accounts and titles created in the app stay.

## Using the app

- **Register / Login** — readers and authors create accounts from Register, then sign in.
- **Books / Research** — browse and search published titles. Members can open PDFs in the reader, save items to **Library**, rate titles, and continue where they left off from the home page.
- **Membership** — purchase or renew membership for full reading access.
- **Author** — authors submit books and papers (PDF + metadata) for review, and can update pending versions.
- **Admin** (`/admin`) — review submissions, publish or reject, manage members, and view activity.

Published titles appear in search, on the home page, and in the book and research lists.
