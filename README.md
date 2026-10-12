# Nextgen Digital Library

Online catalog for books and research papers. Read in the browser. Data lives in MongoDB Atlas. Members sign in with email and password.

## Setup

1. Create a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster. Add a database user and allow your IP (or `0.0.0.0/0` for local development).
2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Set in `.env.local`:

- `MONGODB_URI` — Atlas connection string (`mongodb+srv://...`)
- `MONGODB_DB` — `nextgen-library` (default)
- `AUTH_SECRET` — a long random string (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `AUTH_URL` — `http://localhost:3000`
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` — the first admin. The password must be at least 8 characters. This account is an active member. If the email already exists, it is left unchanged.

4. Install, set up the database, and run:

```bash
npm install
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run seed` creates indexes and the first admin. It does not load a catalog. If this database was seeded with the old sample books, papers, and members, run `npm run seed:reset` once. That removes only those sample records and their stored PDFs. Accounts and titles created in the app stay.

## Adding to the catalog

Readers and authors register from **Register**. Authors submit books and papers from **Author**. An admin reviews submissions at `/admin` and publishes the ones that belong in the catalog. Published titles show up in search, on the home page, and in the book and paper lists.
