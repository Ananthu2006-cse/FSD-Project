# Warehouse Inventory Management System

A full-stack web-based **Warehouse Inventory Management System** built using the **MERN Stack with TypeScript**. The system helps manage products, warehouses, inventory, stock movements, orders, and user access through a centralized platform.

## 🚀 Live Application

**Frontend:** `YOUR_FRONTEND_URL`

**Backend API:** `YOUR_BACKEND_URL`

> Replace the above placeholders with your deployed Render URLs.

---

## 📌 Project Overview

Managing warehouse inventory manually can result in inaccurate stock records, misplaced products, difficulty tracking stock movements, and delays in order fulfillment.

The **Warehouse Inventory Management System** provides a centralized digital platform for managing inventory-related operations. It supports secure authentication, role-based access control, product management, warehouse management, inventory tracking, stock movements, orders, and reports.

---

## 🎯 Objectives

* Digitize warehouse inventory management.
* Maintain accurate product and stock information.
* Manage warehouses and storage locations efficiently.
* Track stock movements and inventory changes.
* Manage orders and their status.
* Provide role-based access to different users.
* Reduce errors associated with manual inventory management.
* Provide a simple and user-friendly interface.

---

## ✨ Features

### 🔐 Authentication & Authorization

* User login using email and password.
* JWT-based authentication.
* Secure password hashing using bcryptjs.
* Role-Based Access Control (RBAC).
* Supports:

  * `ADMIN`
  * `MANAGER`
  * `STAFF`
* Protected frontend routes.
* Backend authorization middleware.

### 📦 Product Management

* Add products.
* View products.
* Update product information.
* Delete products.
* Track product details and quantities.

### 🏭 Warehouse Management

* Create and manage warehouses.
* Manage warehouse locations.
* Associate inventory with storage locations.

### 📊 Inventory Management

* Track available stock.
* Update inventory quantities.
* Monitor inventory levels.
* Maintain inventory information across locations.

### 🔄 Stock Movements

* Track stock movements.
* Record inventory changes.
* Maintain movement history.

### 🛒 Order Management

* Manage warehouse orders.
* Track order information and status.
* Connect inventory operations with orders.

### 📈 Reports

* View inventory-related information.
* Monitor stock and warehouse data.
* Provide useful information for management.

---

# 🛠️ Technology Stack

## Frontend

| Technology                 | Purpose                             |
| -------------------------- | ----------------------------------- |
| **React 18.3.1**           | Component-based user interface      |
| **TypeScript 5.6.2**       | Static typing and type safety       |
| **Vite 6.4.3**             | Frontend development and build tool |
| **Tailwind CSS 3.4.1**     | UI styling                          |
| **React Router DOM 7.0.2** | Client-side routing                 |
| **Axios 1.7.9**            | HTTP communication with backend     |

## Backend

| Technology          | Purpose                         |
| ------------------- | ------------------------------- |
| **Node.js 24.14.0** | Server-side JavaScript runtime  |
| **Express.js**      | REST API framework              |
| **TypeScript**      | Type-safe backend development   |
| **CORS**            | Cross-origin request handling   |
| **dotenv**          | Environment variable management |
| **ts-node-dev**     | Development-time live reload    |

## Database

| Technology                | Purpose                               |
| ------------------------- | ------------------------------------- |
| **MongoDB**               | NoSQL document database               |
| **Mongoose**              | MongoDB ODM and schema management     |
| **mongodb-memory-server** | Development/testing database fallback |

## Security

| Technology               | Purpose                  |
| ------------------------ | ------------------------ |
| **JSON Web Token (JWT)** | Stateless authentication |
| **bcryptjs**             | Password hashing         |
| **RBAC Middleware**      | Role-based authorization |

---

# 🏗️ Architecture

```text
                    WAREHOUSE INVENTORY
                    MANAGEMENT SYSTEM
                             │
             ┌───────────────┴───────────────┐
             │                               │
         FRONTEND                        BACKEND
             │                               │
     React + TypeScript              Node.js + TypeScript
             │                               │
            Vite                         Express.js
             │                               │
     React Router                         REST API
             │                               │
          Axios                    JWT + RBAC Middleware
             │                               │
             └──────────── API ──────────────┘
                             │
                         Mongoose
                             │
                             ↓
                         MongoDB
```

---

# 🔄 Application Flow

```text
User
 │
 ↓
Login
 │
 ↓
Backend validates credentials
 │
 ↓
JWT generated
 │
 ↓
Frontend stores authentication state
 │
 ↓
Axios sends JWT with API requests
 │
 ↓
Express middleware verifies JWT
 │
 ↓
RBAC checks user role
 │
 ↓
Controller processes request
 │
 ↓
Mongoose communicates with MongoDB
 │
 ↓
Response returned to frontend
```

---

# 👥 User Roles

| Role        | Description                                   |
| ----------- | --------------------------------------------- |
| **ADMIN**   | Full administrative access                    |
| **MANAGER** | Access to management and inventory operations |
| **STAFF**   | Access to permitted operational functions     |

> Exact permissions are enforced by the application's RBAC middleware.

---

# 📁 Project Structure

```text
Inventory-Management-System/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── routes/
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── ...
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

> Update the folder structure if your actual project uses different folder names.

---

# 💻 Local Setup

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Git
* MongoDB or access to MongoDB Atlas

---

## 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd Inventory-Management-System
```

---

## 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

The backend will run on:

```text
http://localhost:5000
```

---

## 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

The frontend will run on:

```text
http://localhost:5173
```

---

# ☁️ Deployment

The application is deployed using:

```text
React + Vite
      ↓
Render Static Site

Node.js + Express
      ↓
Render Web Service

MongoDB
      ↓
MongoDB Atlas
```

Environment variables are configured through the hosting platform and are **not committed to the repository**.

---

# 🔒 Environment Variables

Never commit sensitive credentials to GitHub.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
FRONTEND_URL=your_frontend_url
VITE_API_URL=your_backend_url
```

A `.env.example` file can be provided as a template without containing real credentials.

---

# 🧪 API Testing

Backend APIs can be tested using tools such as **Postman**.

Typical operations include:

```text
POST   /api/auth/login

GET    /api/products
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

Additional endpoints are available for warehouses, inventory, stock movements, orders, and reports.

---

# 🔐 Security

The application implements:

* JWT-based authentication.
* Password hashing using bcryptjs.
* Protected API routes.
* Role-Based Access Control.
* Environment variables for sensitive configuration.
* CORS configuration for frontend-backend communication.

---

# 📌 Future Enhancements

Possible future improvements include:

* Advanced inventory analytics.
* Low-stock notifications.
* Barcode/QR-code integration.
* Email notifications.
* Advanced reporting and dashboards.
* Audit logs.
* Cloud-based file/document storage.
* Automated testing and CI/CD.

---

# 👨‍💻 Development Tools

* Visual Studio Code / IntelliJ IDEA
* Git
* GitHub
* Postman
* MongoDB Atlas
* Render

---

# 📄 License

This project was developed as an academic/educational project.

---

## ⭐ Acknowledgement

Developed as part of an academic project to demonstrate full-stack web development, database management, REST API development, authentication, authorization, and inventory management concepts.
