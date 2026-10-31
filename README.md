# 📦 Warehouse Inventory Management System

A full-stack **MERN** web application for managing warehouse inventory, stock movements, orders, and operational analytics — built as a college semester project.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React + TypeScript + Vite |
| **Backend** | Node.js + Express.js + TypeScript |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT (JSON Web Tokens) + bcrypt |
| **Styling** | Tailwind CSS |
| **Hosting** | Render (Backend + Frontend) + MongoDB Atlas |

---

## ✨ Features

### 🔐 Authentication & Access Control
- JWT-based login/logout
- Role-Based Access Control (RBAC)
- Three roles: **ADMIN**, **MANAGER**, **STAFF**
- Protected routes on both frontend and backend

### 📋 Core Modules

| Module | Description | Access |
|---|---|---|
| **Dashboard** | Live KPI metrics and intelligence alerts | All roles |
| **Products** | Product catalogue CRUD | ADMIN/MANAGER (STAFF: view) |
| **Warehouses** | Warehouse & storage location management | ADMIN/MANAGER (STAFF: view) |
| **Inventory** | Stock levels, bin allocations, thresholds | All roles |
| **Stock Movement** | IN / OUT / TRANSFER / ADJUSTMENT | All roles |
| **Orders** | Order fulfillment pipeline (PENDING → DISPATCHED) | All roles |
| **Dispatch** | Outbound bay staging | All roles |
| **Damaged Stock** | Damaged item reporting and resolution | All roles |
| **Reports** | Inventory valuation, low stock, order throughput | ADMIN/MANAGER |
| **Intelligence** | Smart predictions, restock suggestions, demand analytics | ADMIN/MANAGER |
| **User Management** | Manage operator accounts and roles | ADMIN only |

### 🧠 Inventory Intelligence Module
- **Low-Stock Prediction** — calculates days remaining before stock-out using historical OUT movements
- **Automatic Restock Suggestions** — recommends reorder quantities based on consumption rate
- **Demand Analytics** — identifies fast/slow moving products with bar charts and velocity classification

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js v18+
- MongoDB (local) or MongoDB Atlas URI

### 1. Clone the repository
```bash
git clone https://github.com/Ananthu2006-cse/FSD-Project.git
cd FSD-Project
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/inventory_db
JWT_SECRET=your_secret_here
FRONTEND_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`  
Backend runs at: `http://localhost:5000`

---

## 🔑 Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `demo@2024` |
| Manager | `manager@example.com` | `demo@2024` |
| Staff | `staff@example.com` | `demo@2024` |

> Seed data is automatically loaded on first startup when the database is empty.

---

## 📁 Project Structure

```
FSD-Project/
├── backend/
│   ├── src/
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express REST API routes
│   │   ├── middleware/       # JWT auth middleware
│   │   └── server.ts        # App entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── *.tsx            # React page components
    │   ├── api.ts           # Axios API functions
    │   ├── AuthContext.tsx  # Auth state management
    │   ├── App.tsx          # Routes
    │   └── Layout.tsx       # Sidebar + header
    └── package.json
```

---

## 🌐 Deployment

Hosted on **Render** with **MongoDB Atlas**:

| Service | Type |
|---|---|
| Backend | Render Web Service (Node.js) |
| Frontend | Render Static Site |
| Database | MongoDB Atlas (Free M0 Tier) |

---

## 📚 Academic Context

This project was developed as a **Full Stack Development semester project** demonstrating:
- MERN stack architecture
- RESTful API design
- JWT authentication and RBAC
- MongoDB data modelling with Mongoose
- React component-based UI with TypeScript
- Deployment to cloud platforms
