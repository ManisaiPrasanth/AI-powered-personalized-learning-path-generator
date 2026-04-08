# AI Learning Platform (Capstone)

## Run locally

### Backend

```bash
cd backend
npm install
npm run migrate
npm run dev
```

Server: `http://localhost:4000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173` (proxies `/api` to the backend in dev).

---

## Admin portal

Use the **same login page** as students. After sign-in, admins are redirected to `/admin/dashboard`.

### Default admin credentials (created automatically on first backend start)

| Field    | Value                    |
|----------|--------------------------|
| **Email**    | `admin@ailearning.local` |
| **Password** | `Admin@2025!`            |

**Security:** Change this password in production (update the `Users` row or add a password-reset flow).

### Admin features

- **Overview:** total students, learners active today, quiz attempts today, average score, count of learners with low unit scores.
- **Students table:** per-student quiz attempts, best score, latest unit score, units completed, last exam time.
- **Messaging:** send in-app messages to students (visible under **Inbox** in the student nav).

---

## Environment

Create `backend/.env` as needed, e.g.:

```env
JWT_SECRET=your-long-random-secret
PORT=4000
```

Optional keys for other features are documented in `backend/.env.example` if present.
