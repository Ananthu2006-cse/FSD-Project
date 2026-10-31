# Inventory Management System: Run Guide and Deployment Instructions

A full-stack warehouse inventory app: **React + TypeScript (Vite, Tailwind)** frontend, **Node.js + Express + TypeScript** backend, **MongoDB (Mongoose)** database, **JWT** authentication with ADMIN / MANAGER / STAFF roles.

---

## 1. Project structure

```
Inventory Management System/
├── backend/
│   ├── src/
│   │   ├── server.ts          # app entry, DB connection, seed data
│   │   ├── middleware/auth.ts # JWT + role checks
│   │   ├── models/            # Mongoose schemas
│   │   └── routes/            # REST API routes
│   ├── test_all_phases.js     # API regression tests
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/                   # React pages and components
    ├── vite.config.ts         # dev server (5173) + /api proxy to 5000
    ├── .env.example
    └── package.json
```

---

## 2. Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Node.js | 18 or newer (20 LTS recommended) | `node -v` |
| npm | comes with Node | `npm -v` |
| Git | any recent | `git --version` |
| MongoDB | optional locally (see 3.2) | `mongod --version` |

---

## 3. Run locally

### 3.1 Get the code

```bash
git clone https://github.com/Ananthu2006-cse/FSD-Project.git
cd FSD-Project
```
(If the project sits in a sub-folder, `cd` into the folder that contains `backend` and `frontend`.)

### 3.2 Start the backend (terminal 1)

```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/inventory_db
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRATION=86400000
```

Start it:

```bash
npm run dev
```

You should see `[Database] Connected to MongoDB successfully.` and `[Server] Warehouse Inventory API running on port 5000`.

**No MongoDB installed?** That is fine. If the backend cannot reach MongoDB within about 2.5 seconds, it automatically starts an **in-memory MongoDB** (via `mongodb-memory-server`) and seeds demo data. Data is lost when you stop the server, which is ideal for demos and testing.

Check the API: open <http://localhost:5000/api/health>. It should return `"status":"UP"`.

### 3.3 Start the frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies every `/api` call to `http://localhost:5000`, so no frontend `.env` is needed locally.

### 3.4 Demo logins (created automatically on first start)

| Role | Email | Password |
|---|---|---|
| ADMIN | admin@example.com | demo@2024 |
| MANAGER | manager@example.com | demo@2024 |
| STAFF | staff@example.com | demo@2024 |

The login page also has one-click ADMIN / MANAGER / STAFF buttons.

### 3.5 Production build check

```bash
cd backend  && npm run build     # compiles TypeScript to dist/
cd ../frontend && npm run build  # tsc && vite build, output in dist/
```
Both must finish with no errors before you deploy.

### 3.6 Run the API tests

With the backend running on port 5000:

```bash
cd backend
node test_all_phases.js
```
The script exercises login, role checks, inventory, stock movements, damaged stock, orders and reports, and prints PASS or FAIL per phase.

---

## 4. Environment variables

**Backend (`backend/.env`)**

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | no (default 5000) | API port. Render sets this itself |
| `MONGODB_URI` | yes in production | MongoDB / Atlas connection string |
| `JWT_SECRET` | yes in production | Secret used to sign tokens |
| `JWT_EXPIRATION` | no | Token lifetime in milliseconds |
| `FRONTEND_URL` | yes in production | Exact frontend origin allowed by CORS |

**Frontend (`frontend/.env`, production only)**

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL, e.g. `https://your-backend.onrender.com` (no trailing slash, no `/api`) |

`VITE_*` values are baked in at **build time**. If you change one, rebuild or redeploy the frontend.

---

## 5. Deploy to the cloud (MongoDB Atlas + Render)

Deploy in this order: **database, then backend, then frontend**, then connect them.

### Step 1: MongoDB Atlas (database)

1. Create a free account at <https://www.mongodb.com/cloud/atlas> and create a free **M0** cluster.
2. **Database Access** → Add Database User → username and password. Use letters and digits, or URL-encode special characters.
3. **Network Access** → Add IP Address → **Allow access from anywhere** (`0.0.0.0/0`). Render's free tier has no fixed IP.
4. **Connect** → Drivers → copy the connection string and add the database name:
   ```
   mongodb+srv://<username>:<password>@<cluster-host>/inventory_db?retryWrites=true&w=majority
   ```

### Step 2: Backend on Render (Web Service)

1. Push your code to GitHub. Make sure `.env` is **not** committed (it is listed in `.gitignore`).
2. On <https://render.com>: **New → Web Service** → connect the GitHub repo.
3. Settings:

   | Field | Value |
   |---|---|
   | Root Directory | `backend` (include the parent folder if your repo nests it) |
   | Runtime | Node |
   | Build Command | `npm install --include=dev && npm run build` |
   | Start Command | `npm start` |
   | Instance type | Free |

   `--include=dev` ensures TypeScript is installed for the build.
4. **Environment** → add:
   - `MONGODB_URI` = your Atlas string
   - `JWT_SECRET` = a long random value (generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
   - `JWT_EXPIRATION` = `86400000`
   - `FRONTEND_URL` = leave blank for now; fill in after Step 3
5. Deploy. When the log shows `Connected to MongoDB successfully`, open
   `https://<your-backend>.onrender.com/api/health` and confirm `"database":"CONNECTED"`.

### Step 3: Frontend on Render (Static Site)

1. **New → Static Site** → same repo.
2. Settings:

   | Field | Value |
   |---|---|
   | Root Directory | `frontend` |
   | Build Command | `npm install && npm run build` |
   | Publish Directory | `dist` |

3. **Environment** → `VITE_API_URL` = `https://<your-backend>.onrender.com`
4. **Redirects/Rewrites** → add a rewrite rule: Source `/*`, Destination `/index.html`, Action **Rewrite**. Without it, refreshing a page such as `/products` shows "Not Found".
5. Deploy and note the URL, e.g. `https://your-frontend.onrender.com`.

### Step 4: Connect them

1. In the **backend** service, set `FRONTEND_URL` to the frontend URL **exactly**, with `https://` and **no trailing slash**.
2. Save, which redeploys the backend.
3. Open the frontend URL and log in with the demo account.

### Step 5: Post-deploy checklist

- [ ] `/api/health` shows `UP` and `CONNECTED`
- [ ] Login works for all three roles
- [ ] Dashboard loads with seeded data
- [ ] Refreshing a sub-page does not give 404
- [ ] STAFF cannot create products (403 / Access Denied)

> **Free-tier note:** Render free web services sleep after about 15 minutes idle. The first request after that can take about 30 to 60 seconds. Open the backend `/api/health` URL a minute before a demo to wake it.

---

## 6. Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Browser console: CORS error | `FRONTEND_URL` on the backend does not exactly match the frontend origin (check `https`, spelling, trailing slash) |
| Login shows a network error in production | `VITE_API_URL` missing or wrong. Fix it, then **rebuild** the frontend |
| `MongooseServerSelectionError` | Atlas Network Access does not allow `0.0.0.0/0`, or the username or password in the URI is wrong |
| `tsc: not found` during Render build | Use `npm install --include=dev && npm run build` |
| Blank page or 404 after refresh | Add the `/*` → `/index.html` rewrite on the Static Site |
| `EADDRINUSE: port 5000` locally | Another process uses the port. Stop it or change `PORT` |
| Data disappears after restart locally | Backend fell back to in-memory MongoDB. Start MongoDB or set an Atlas URI |
| 401 on every request after redeploy | `JWT_SECRET` changed, so old tokens are invalid. Log out and in again |

---

## 7. Security notes (read before sharing the repo)

1. **Never commit `.env`.** It is already in `.gitignore`. If a real secret or Atlas password was ever pushed, rotate it immediately.
2. **Rotate `JWT_SECRET`** for production. Do not reuse the development value.
3. **Remove the fallback secret literal** in `backend/src/middleware/auth.ts` and `backend/src/routes/authRoutes.ts` (`process.env.JWT_SECRET || '...'`). Make the server exit with an error if `JWT_SECRET` is missing.
4. **Demo users are reset on every start.** `seedUsers()` in `server.ts` re-hashes the password `demo@2024` for the three demo accounts each time the server boots. For real use, change the demo password and stop resetting existing users.
5. **Restrict Atlas access** (specific IPs) and **set `FRONTEND_URL`** in production so CORS is not open to all origins.
6. Do not share ZIP files that contain `backend/.env`.

---

## 8. Quick command reference

```bash
# Backend
cd backend && npm install && npm run dev        # dev server (port 5000)
cd backend && npm run build && npm start        # production mode

# Frontend
cd frontend && npm install && npm run dev       # dev server (port 5173)
cd frontend && npm run build                    # production build to dist/

# Tests (backend running)
cd backend && node test_all_phases.js
```
