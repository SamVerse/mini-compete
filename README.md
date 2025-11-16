**Structure:** Monorepo with multiple apps and shared packages. The main apps are `apps/backend` and `apps/frontend`.

**Quick Start (local, Windows PowerShell)**
- Start supporting services (Postgres, Redis):

```powershell
docker compose up -d
```

- Install dependencies and start development servers from repository root:

```powershell
npm install
npm run dev
```

To run backend
```powershell
npm run start:dev
```

**RUNNING-APP**
You should now have Docker yaml , backend and frontend running in the terminal.

- Notes:
  - `npm run dev` uses `turbo` and will run `dev` scripts for workspace apps.
  - Backend default port: `3001`. Frontend default port: `3000`.

**Database and seeding**
- Example env file: `apps/backend/.env.example` (copy to `apps/backend/.env` and adjust if needed).
- Apply migrations and generate Prisma client (run from `apps/backend`):

```powershell
cd apps/backend
npx prisma generate
npx prisma migrate deploy
npx ts-node prisma/seed.ts    # seeds sample users and competitions
```

**Environment variables (important)**
- `DATABASE_URL` : Postgres connection (see `.env.example`).
- `REDIS_HOST`, `REDIS_PORT` : Redis connection for BullMQ and idempotency.
- `JWT_SECRET` : secret used for signing auth tokens.

**helpers**
- Postman collections are included in the repo root for quick API testing (`Mini Compete.postman_collection.json`).

**Architecture Notes**

Idempotency

- The registration endpoint supports idempotency to prevent duplicate submissions from the same client. A custom NestJS middleware handles this using Redis:

- The client sends an Idempotency-Key header.

- The middleware uses SETNX to create a temporary processing lock for that key.

- If the key is new, the request executes normally.

- After the controller finishes successfully, the middleware stores the final { status, body } response under result:<key>.

- If the same key appears again, the stored response is returned immediately without running registration logic again.

- If a request with the same key is still being processed, the middleware returns a 409.

- Idempotency protects against retries and duplicate client actions, but it does not prevent overselling because each user sends a different key.

----
-------------


Concurrency and Oversell Prevention

-> To prevent two users from taking the same seat at the same time, the registration logic runs inside a Prisma transaction and uses an atomic conditional update:
1. The transaction locks the competition row FOR UPDATE to prevent concurrent modifications.
2. It checks if the user is already registered.
3. It counts current registrations.
4. If there is capacity, it creates the registration.
This ensures that even if multiple users try to register simultaneously, the database will serialize their transactions and prevent overselling.


------

**Tradeoffs**

Idempotency

- Good for preventing duplicate submissions.

- Ensures safe retries.
    
- Does not protect shared resources between different users.

Atomic Update

- Simple and safe with Prisma.

- Prevents overselling reliably.

- Less flexible than low-level row locks but avoids raw SQL and works well for this use case.


