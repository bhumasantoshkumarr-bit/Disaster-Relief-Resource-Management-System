# Disaster Relief Resource Management System

A production-grade, enterprise emergency operations and supply chain logistics platform designed for humanitarian disaster response coordinators, disaster relief officers, warehouse managers, emergency camps, field hospitals, and volunteer response teams.

---

## Overview

The **Disaster Relief Resource Management System (DRRM)** provides end-to-end command and control during humanitarian emergencies. From the initial declaration of catastrophic incidents (floods, cyclones, earthquakes) to relief center resource requisitions, warehouse inventory reservation, transport logistics dispatch, and volunteer task coordination, the platform delivers verifiable real-time transparency, rigorous role-based security, and complete auditability.

---

## Features

- **Operations Command Dashboard**: Real-time KPI metrics (active incidents, affected population, critical requisitions, available stock, active convoys, field personnel, and fulfillment rate) powered exclusively by database aggregations.
- **Incident Lifecycle Management**: Multi-tier disaster tracking with severity tagging, geospatial hazard radiuses, affected population estimations, and status resolution workflows.
- **Resource Requisition Workflow**: Camp managers and hospitals submit priority-coded requests with itemized line manifests.
- **Transactional Stock Allocation**: Multi-warehouse inventory reservation with atomic transactions (`prisma.$transaction`), strictly preventing negative inventory, over-allocations, and duplicate allocations.
- **Supply Chain Logistics Pipeline**: Full delivery lifecycle tracking (`Pending` -> `Dispatched` -> `In Transit` -> `Delivered`) with automated convoy departure and arrival timestamps, cargo manifests, and driver tracking.
- **Automated Requisition Fulfillment**: Delivering a shipment automatically verifies line items and marks the underlying requisition as `Fulfilled`.
- **Geospatial Tactical Map**: Interactive Leaflet cartography plotting disaster hazard zones, central warehouse hubs, relief shelters, hospitals, and active transport convoys with real-time route lines.
- **Automated Stock Level Alerts**: Real-time notifications triggered whenever inventory drops below configurable minimum safety thresholds.
- **Volunteer Response Roster**: Field volunteer registration, skill indexing, disaster deployment assignment, and operational task execution.
- **Operational Reports & Analytics**: Recharts visualizations breakdown of incident types, severity distribution, category stock distribution, delivery performance, and warehouse capacity utilization.
- **Enterprise Security & Audit Trail**: Every sensitive operation (login, incident creation, stock allocation, status modification, delivery dispatch) is immutably recorded in the system `AuditLog`.

---

## User Roles

The platform enforces 5 distinct role tiers:

1. **ADMIN**
   - Universal authority: User account administration, system configuration, disaster registry, warehouse network oversight, audit log inspection, and full operational access.
2. **DISASTER_OFFICER**
   - Strategic incident response: Registers and manages disasters, evaluates emergency requisitions, approves requests, allocates warehouse stock, and issues operational field tasks.
3. **RESOURCE_MANAGER**
   - Logistics and warehousing: Manages central warehouse inventory, tracks low-stock thresholds, updates warehouse utilization, and oversees vehicle delivery dispatches.
4. **RELIEF_CAMP_MANAGER**
   - Field relief facilities & hospitals: Submits critical resource requests, tracks requisition approval stages, monitors incoming convoy arrivals, and updates shelter population census.
5. **VOLUNTEER**
   - Field operations & rescue personnel: Views assigned disaster zones, tracks field response tasks, updates progress status (`Pending` -> `In Progress` -> `Completed`), and assists relief efforts.

---

## Architecture

The system utilizes a modular, modern Next.js 15 App Router architecture with server-side validation and database transactions:

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│  Next.js 15 App Router (React 19, Tailwind CSS, Recharts)   │
│  Interactive Leaflet Map • Toast Notifications • Modals     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON / JWT Cookies
┌──────────────────────────────▼──────────────────────────────┐
│                    API & Business Logic                     │
│  Next.js Server Handlers • Zod Request Validation           │
│  Role-Based Access Control (RBAC) Guard • Audit Logging     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Prisma ORM Client
┌──────────────────────────────▼──────────────────────────────┐
│                       Data Storage                          │
│  SQLite (dev.db) / PostgreSQL Compatible Database           │
│  Atomic Transactions • Foreign Key Cascades • Enums         │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

- **Framework**: Next.js 15.5+ (App Router)
- **Language**: TypeScript 5.7+
- **Styling**: Tailwind CSS 3.4+ with custom design system
- **Database ORM**: Prisma 6.4+
- **Database Engine**: SQLite (`file:./dev.db`) / PostgreSQL compatible
- **Authentication**: JWT Cookie-based Auth (`jsonwebtoken`), `bcryptjs` password hashing
- **Validation**: Zod 3.24+ schema validation
- **Interactive Maps**: Leaflet 1.9+, React-Leaflet 5.0+
- **Charts & Data Visualization**: Recharts 2.15+
- **Iconography**: Lucide React

---

## Database Schema

Key models defined in `prisma/schema.prisma`:

- **User**: User accounts with email, hashed passwords, roles (`ADMIN`, `DISASTER_OFFICER`, `RESOURCE_MANAGER`, `RELIEF_CAMP_MANAGER`, `VOLUNTEER`), optional warehouse/camp associations.
- **Disaster**: Emergency incidents with type, severity, status, affected area, coordinates (`latitude`/`longitude`), estimated population, and timestamps.
- **Warehouse**: Logistics storage depots with capacity, current utilization percentage, contact info, and coordinates.
- **Resource**: Stock items categorized (Food, Water, Medicine, Tents, Fuel, etc.) with physical units, quantities, minimum stock levels, and computed status (`Available`, `Low_Stock`, `Out_of_Stock`).
- **ReliefCenter**: Shelters, camps, and emergency hospitals with capacity, current population, coordinates, and emergency level.
- **ResourceRequest**: Formal requisitions tied to disasters and relief centers, tracking priority, justification, and status.
- **RequestItem**: Individual line items requesting category/resource with requested and fulfilled quantities.
- **ResourceAllocation**: Transactional allocations linking requests, warehouse resources, quantities, and officers.
- **Delivery**: Supply shipments tracking source warehouse, destination center, vehicle ID, driver details, and status pipeline (`Pending`, `Dispatched`, `In_Transit`, `Delivered`).
- **DeliveryItem**: Items on a transport manifest linked to allocations.
- **Volunteer**: Registered field personnel with skills, deployment status, and assigned incident.
- **Task**: Operational response tasks assigned to volunteers with priority and status.
- **Notification**: Targeted or broadcast system alerts for critical requests, low inventory, and delivery status changes.
- **AuditLog**: Immutable historical audit trail of sensitive user actions.

---

## Application Modules

| Module | Route | Access Roles | Description |
|---|---|---|---|
| **Overview Dashboard** | `/dashboard` | All Roles | Live KPI cards, situation map, recent incidents, critical requests, and charts. |
| **Disasters Roster** | `/disasters` | Admin, Officer, Volunteer | Incident management table, filters, register and edit dialogs. |
| **Disaster Details** | `/disasters/[id]` | All Roles | Deep-dive incident command view, timeline, hazard map, linked requests & tasks. |
| **Resources Inventory** | `/resources` or `/inventory` | Admin, Manager, Officer | Warehouse stock ledger, stock adjustments, low-stock indicators. |
| **Warehouse Network** | `/warehouses` | Admin, Manager, Officer | Central logistics depots, capacity meters, utilization tracking. |
| **Relief Facilities** | `/relief-centers` or `/camps` | Admin, Officer, Camp Manager | Shelters and emergency hospitals, census occupancy, emergency triage levels. |
| **Requisitions** | `/requests` | Admin, Officer, Manager, Camp | Requisition workflow, status filters, approvals, and allocation dialogs. |
| **Requisition Details**| `/requests/[id]` | All Roles | Itemized fulfillment progress, allocation history, direct convoy dispatch. |
| **Supply Logistics** | `/deliveries` | Admin, Manager, Camp, Officer | Transport convoy pipeline, driver contact details, status updates. |
| **Delivery Tracking** | `/deliveries/[id]` | All Roles | Route transit corridor map, cargo manifest, departure/arrival tracking. |
| **Volunteer Roster** | `/volunteers` | Admin, Officer, Volunteer | Field personnel directory, skill index, incident assignment. |
| **Field Tasks** | `/tasks` | Admin, Officer, Volunteer | Task board, priority tagging, volunteer assignment, status tracking. |
| **Tactical Map** | `/map` | All Roles | Full-screen geospatial map with layer toggles for hazards, hubs, camps, and convoys. |
| **Analytics & Reports**| `/reports` | Admin, Officer, Manager | Fulfillment rates, delivery performance, warehouse utilization metrics. |
| **Notifications** | `/notifications` | All Roles | Real-time alert feed with unread filtering and mark-as-read actions. |
| **User Administration**| `/users` | Admin Only | User directory, role assignment, account creation. |
| **Security Audit Logs**| `/audit-logs` | Admin Only | Immutable security and operation audit trail. |
| **Settings** | `/settings` | All Roles | Profile settings, notification preferences, system environment parameters. |

---

## Authentication

- **Session Management**: Secure, HTTP-only JWT session cookie (`disaster_session`) signed with `JWT_SECRET`.
- **Password Security**: Passwords are cryptographically salted and hashed using `bcryptjs` (cost factor 10).
- **Security Protections**: User passwords are excluded by default in database queries via explicit Prisma `select` projections.
- **Demo Role Switcher**: A convenient role switcher in the application header enables rapid evaluation across all 5 user role perspectives.

---

## Resource Allocation Workflow

```
[ Relief Camp Manager ]
        │  1. Submits ResourceRequest (Priority, Quantities, Justification)
        ▼
[ ResourceRequest created with status: "Pending" ]
        │
        ▼
[ Disaster Officer ]
        │  2. Reviews request in Command Center
        │  3. Approves request (status -> "Approved")
        │  4. Selects source warehouse and executes ResourceAllocation
        ▼
[ Atomic Transaction ($transaction) ]
        ├── Checks inventory availability (fails if quantity < allocated)
        ├── Prevents negative stock and over-allocations
        ├── Deducts resource quantity from Warehouse
        ├── Updates Resource status (Available / Low_Stock / Out_of_Stock)
        ├── Emits LOW_INVENTORY notification if threshold breached
        ├── Creates ResourceAllocation record
        ├── Updates RequestItem fulfilledQuantity
        └── Updates ResourceRequest status (Partially_Fulfilled / Fulfilled)
        ▼
[ Logistics Dispatch ]
        │  5. Delivery created (status -> "Dispatched") with cargo manifest
        ▼
[ Delivery Pipeline ]
        ├── "Dispatched" (departure timestamp logged)
        ├── "In_Transit" (convoy moving along route corridor)
        └── "Delivered" (arrival timestamp logged)
                └── Associated ResourceRequest automatically marked "Fulfilled"
```

---

## Disaster Management

- Incident registry capturing disaster category (Flood, Cyclone, Earthquake, Landslide, Wildfire, Drought, Industrial Accident, Other).
- Severity level classification (`Low`, `Medium`, `High`, `Critical`).
- Geolocation tracking with interactive map hazard radius circles.
- Affected population estimation and incident timeline tracking.
- Protected deletion and closure: closing an incident safely disables future requisition creation.

---

## Request Management

- Support for multi-item requisitions across essential humanitarian categories (Water, Food, Medicine, Blankets, Tents, Fuel, Rescue Equipment, Hygiene Kits).
- Role-gated review actions: Only Disaster Officers, Resource Managers, and Admins can approve or reject requests.
- Business rule protections: Requests with `Fulfilled` or `Cancelled` statuses are locked against invalid modifications.

---

## Delivery Management

- Dedicated transport tracking with driver credentials, phone contacts, and vehicle identifiers.
- Four-stage delivery progression: `Pending` -> `Dispatched` -> `In Transit` -> `Delivered`.
- Strict business rule: Shipments marked as `Delivered` cannot be re-dispatched or reverted.

---

## Volunteer Management

- Volunteer registration with skill profiling (Water Rescue, Medical Triage, Structural Clearance, Communications).
- Direct incident assignment linking volunteers to active disasters.
- Operational task management with priority, due date, and status progression.

---

## Map

- Powered by Leaflet and OpenStreetMap.
- Custom color-coded tactical markers:
  - **Red**: Disaster incidents with danger radius circles.
  - **Blue**: Central logistics warehouse hubs.
  - **Green**: Relief camps and emergency hospitals.
  - **Orange**: Active transport convoys with dashed route lines.
- Safe coordinate validation: Gracefully handles missing, null, or out-of-bounds coordinates without crashing the map canvas.
- Layer toggles enabling selective filtering of incidents, warehouses, shelters, and convoys.

---

## Analytics

- 100% database-backed metrics: no mocked or hardcoded figures.
- Recharts visualizations:
  - Stock quantities by category (Bar chart)
  - Requisition status breakdown (Pie chart)
  - Warehouse utilization percentages
  - Delivery performance ratios
  - Volunteer deployment availability

---

## Quick Start (Single Click)

On Windows, simply double-click:
```text
start.bat
```
*(Located either in the root `Santhu\` folder or inside `Disaster-Relief-Resource-Management-System\`)*.

This will automatically:
1. Verify Node.js and configuration.
2. Install packages and seed the SQLite database if missing.
3. Automatically launch your default browser at **http://localhost:3000**.
4. Display the test credentials right in the console window.

---

## Installation

### Prerequisites
- Node.js (v18.17+ or v20+ recommended, tested on v24)
- npm (v9+)

### Steps
```bash
# 1. Clone repository and navigate to project root
cd Disaster-Relief-Resource-Management-System

# 2. Install dependencies
npm install
```

---

## Environment Variables

Ensure `.env` exists in the project root:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="v8jlR0xrWSnk6FYO8Aqwvu8ZGodX5DA9MIe9BvljsG0="
NEXTAUTH_SECRET="qyNdJnyioT5q13LCPV+zs+qY9wpTKnQGl3uktwgqHyY="
NEXTAUTH_URL="http://localhost:3000"
```

---

## Database Setup

```bash
# Push Prisma schema to local database
npm run db:push
```

---

## Seed Database

Populate realistic demo data including 3 disasters (major flood, cyclone, earthquake), multiple warehouses, relief shelters, hospitals, resources, requests, deliveries, and tasks:

```bash
npm run db:seed
```

---

## Run Development Server

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Build

```bash
# Compile and create optimized production build
npm run build

# Start production server
npm run start
```

---

## Default Demo Accounts

All seeded accounts use the default password: **`password123`**

| Role | Name | Email | Default Password |
|---|---|---|---|
| **Admin** | Sarah Jenkins | `admin@disaster.org` | `password123` |
| **Disaster Officer** | Cmdr. Robert Chen | `officer@disaster.org` | `password123` |
| **Resource Manager** | Marcus Vance | `manager@disaster.org` | `password123` |
| **Relief Camp Manager** | Elena Rostova | `camp@disaster.org` | `password123` |
| **Volunteer** | David Miller | `volunteer@disaster.org` | `password123` |

*Tip: You can use the Quick Login buttons on `/login` or the Role Switcher in the top navigation bar to instantaneously evaluate any role perspective.*
