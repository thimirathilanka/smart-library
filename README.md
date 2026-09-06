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

4. Install, seed, and run:

```bash
npm install
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Seeded logins

Password for every seeded member: `library123`

| Membership | Email |
| --- | --- |
| Member (admin) | `admin@nextgen.library` |
| Member | `a.chen@nextgen.library` |
| Member (admin) | `l.haddad@nextgen.library` |
| Not a member | `j.adeyemi@nextgen.library` |

New readers can use **Register** (not a member yet). Admin accounts can open `/admin`. Members can read members-only titles.
