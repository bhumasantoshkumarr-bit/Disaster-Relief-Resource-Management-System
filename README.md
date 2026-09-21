# Disaster Relief Resource Management System

A production-quality, full-stack emergency response and resource management web application built for government disaster-response teams, NGOs, relief camps, emergency hospitals, central warehouses, volunteers, and administrators.

---

## 🛠 Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, CSS Glassmorphism
- **Database**: PostgreSQL / SQLite via Prisma ORM
- **Authentication**: JWT Cookie-based Auth with bcryptjs password hashing & role-based access control (RBAC)
- **Validation**: Zod & React Hook Form
- **Analytics & Charts**: Recharts
- **Interactive Maps**: Leaflet / React-Leaflet with OpenStreetMap
- **Icons**: Lucide React

---

## 👥 Application Roles

1. **ADMIN**
   - Full system access, manage users, disasters, warehouses, relief centers, resources, requests, deliveries, and system audit logs.

2. **DISASTER OFFICER**
   - Create and manage disaster incidents, monitor affected zones, review supply requests, allocate resources, and assign field response tasks.

3. **RESOURCE MANAGER**
   - Manage central warehouse inventory, monitor low-stock thresholds, update stock levels, and approve dispatch allocations.

4. **RELIEF CAMP / HOSPITAL MANAGER**
   - Submit resource requisitions, track request approval statuses, monitor incoming shipment deliveries, and update occupancy levels.

5. **VOLUNTEER / RESPONSE TEAM**
   - View assigned field tasks, update task execution status, view disaster zones, and report operational completion.

---

## 🔑 Demo Login Credentials

All demo accounts are seeded with password: `password123`

| Role | Email | Default Password |
|---|---|---|
| **Admin** | `admin@disaster.org` | `password123` |
| **Disaster Officer** | `officer@disaster.org` | `password123` |
| **Resource Manager** | `manager@disaster.org` | `password123` |
| **Relief Camp Manager** | `camp@disaster.org` | `password123` |
| **Volunteer** | `volunteer@disaster.org` | `password123` |

*Note: The navigation bar includes a quick **Role Switcher** dropdown for instant evaluation of all 5 role perspectives.*

---

## 🚀 Getting Started

### 1. Environment Configuration
Ensure `.env` file is present in root:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="disaster-relief-super-secret-key-2026-secure-auth"
NEXTAUTH_SECRET="disaster-relief-super-secret-key-2026-secure-auth"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Database Migration & Seeding
```bash
# Push Prisma schema to SQLite/PostgreSQL
npx prisma db push

# Seed sample data (disasters, warehouses, relief centers, resources, requests, deliveries, volunteers)
npm run db:seed
```

### 3. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 Core API Modules

- `POST /api/auth/login` — User authentication & JWT session cookie.
- `POST /api/auth/switch-role` — Instant role context switcher.
- `GET/POST/PUT/DELETE /api/disasters` — Disaster incident management.
- `GET/POST/PUT /api/warehouses` — Warehouse hub management.
- `GET/POST/PUT /api/resources` — Resource stock CRUD with low-stock warnings.
- `GET/POST/PUT /api/relief-centers` — Relief camp & hospital tracking.
- `GET/POST/PUT /api/requests` — Requisition workflow.
- `POST /api/allocations` — Safe inventory deduction & allocation execution.
- `GET/POST/PUT /api/deliveries` — Shipment dispatch & delivery tracking.
- `GET/POST/PUT /api/volunteers` — Volunteer roster & task assignments.
- `GET/POST/PUT /api/tasks` — Disaster task management.
- `GET /api/analytics` — KPI metrics & Recharts visualization data.
- `GET /api/audit-logs` — System security audit trail.
