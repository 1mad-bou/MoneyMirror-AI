# MoneyMirror AI

> **Intelligent Personal Finance Tracker with Receipt OCR, Natural Language Ingestion, and a Read-Only RAG Financial Assistant.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-000000.svg?style=flat&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20pgvector-336791.svg?style=flat&logo=postgresql)](https://github.com/pgvector/pgvector)
[![TailwindCSS](https://img.shields.io/badge/UI-Tailwind%20CSS-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Container-Docker%20Compose-2496ED.svg?style=flat&logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Team
 
**Team Name:** NET
 
**Members:**
- Mehdi AIT MOUSSE
- Brahim Lidrissi
- Imad Bouzina


**Video Demo:** [Watch the MoneyMirror AI demo] demo-vedio.webm
---

## Table of Contents

- [Video Demo](#video-demo)
- [Overview](#overview)
- [Screenshots & UI Preview](#screenshots--ui-preview)
- [Project Flow & Architecture](#project-flow--architecture)
  - [Core Workflow](#1-the-core-pipeline)
  - [End-to-End System Flow](#2-end-to-end-system-flow)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running with Docker Compose](#running-with-docker-compose-recommended)
  - [Running Locally for Development](#running-locally-for-development)
- [API Reference](#api-reference)
- [Security & Design Principles](#security--design-principles)
- [Testing](#testing)

---

## Video Demo

A short walkthrough of MoneyMirror AI, covering receipt scanning, natural language entry, draft review and confirmation, and the read-only RAG financial assistant:

**[Watch the demo video](https://YOUR_VIDEO_DEMO_LINK_HERE)**

---

## Overview

**MoneyMirror AI** is a personal finance management platform designed to eliminate the friction of tracking expenses. Instead of tedious manual entry, users can capture receipts via camera/upload or express transactions in natural language. An embedded AI vision and OCR engine extracts transaction metadata into drafts, allowing users to inspect and adjust the figures before confirming.

Once recorded, transactions are indexed with dense vector embeddings (`FastEmbed` + `pgvector`), enabling a conversational, **read-only RAG (Retrieval-Augmented Generation) financial assistant** to answer queries, analyze habits, and propose actionable spending-reduction strategies based strictly on real personal data.

---

## 📸 Screenshots & UI Preview

### 🏠 Dashboard & 🧾 Receipt Scanning
| **Home Dashboard** | **Receipt Scanning & OCR Extraction** |
|:---:|:---:|
| ![Home Dashboard](imgs/home.png) | ![Scan Receipt](imgs/scan-receipt.png) |
| *Cash balance, recent activity, and quick money actions* | *Receipt image upload, OCR line-item parsing & confirmation* |

<br>

### 🤖 AI Financial Assistant & 💬 RAG Chatbot
| **AI Assistant Overview** | **Interactive Financial Chatbot** |
|:---:|:---:|
| ![AI Assistant Overview](imgs/ai_agent.png) | ![RAG Financial Chat](imgs/chat.png) |
| *RAG-powered financial intelligence & insights* | *Read-only conversational advice grounded in real data* |

---

## Project Flow & Architecture

### 1. The Core Pipeline

MoneyMirror AI strictly adheres to a human-in-the-loop guarantee:

$$\text{Capture} \longrightarrow \text{Extract} \longrightarrow \text{Review} \longrightarrow \text{Confirm} \longrightarrow \text{Save} \longrightarrow \text{Analyze}$$

```
   [Receipt Image / Text]
             │
             ▼
      ┌──────────────┐
      │  AI Extract  │  (RapidOCR / Vision / Regex Fallbacks)
      └──────┬───────┘
             │
             ▼
      ┌──────────────┐
      │ ReceiptDraft │  (Transient payload, NEVER auto-persisted)
      └──────┬───────┘
             │
             ▼
      ┌──────────────┐
      │ User Review  │  (Edit merchant, date, amount, category in UI)
      └──────┬───────┘
             │ (User clicks "Confirm & Save")
             ▼
      ┌──────────────┐
      │  PostgreSQL  │  (Persist Transaction & Index with pgvector)
      └──────┬───────┘
             │
             ▼
      ┌──────────────┐
      │ RAG / Charts │  (Read-only Assistant & Financial Analytics)
      └──────────────┘
```

### 2. End-to-End System Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant Frontend as Next.js 14 (KHAZI UI)
    participant Backend as FastAPI REST API
    participant AI as AI Engine (OCR / Gemma / FastEmbed)
    participant DB as PostgreSQL + pgvector

    %% Auth Flow
    Note over User, DB: Authentication & Setup
    User->>Frontend: Register / Log in (Credentials)
    Frontend->>Backend: POST /api/auth/token
    Backend->>DB: Verify user / Hash password
    Backend-->>Frontend: JWT Bearer Access Token

    %% Transaction Draft Flow
    Note over User, DB: Receipt / Natural Language Capture
    alt Receipt Upload
        User->>Frontend: Upload receipt image (JPEG, PNG, WebP)
        Frontend->>Backend: POST /api/receipts/scan
        Backend->>AI: Extract text, date, amount, items
        AI-->>Backend: Parsed ReceiptDraft
    else Natural Language Input
        User->>Frontend: "Spent 45 MAD on coffee at Starbucks yesterday"
        Frontend->>Backend: POST /api/ai/transaction-draft
        Backend->>AI: Parse intent and entities
        AI-->>Backend: Parsed ReceiptDraft
    end
    Backend-->>Frontend: Return editable ReceiptDraft (NO DB WRITE)

    %% Confirmation
    Note over User, DB: Review & Confirmation
    Frontend->>User: Display preview modal (pre-filled fields)
    User->>Frontend: Confirm & Save
    Frontend->>Backend: POST /api/transactions
    Backend->>DB: INSERT INTO transactions
    Backend->>AI: Compute FastEmbed embedding (bge-small-en-v1.5)
    Backend->>DB: INSERT INTO transaction_embeddings (pgvector)
    Backend-->>Frontend: Transaction persisted

    %% Analytics & RAG Chat
    Note over User, DB: Read-Only Analytics & Financial Assistant
    User->>Frontend: "How much did I spend on dining this month?"
    Frontend->>Backend: POST /api/ai/chat
    Backend->>DB: Semantic Search + ReadOnlyFinanceTools (User Isolated)
    Backend->>AI: Synthesize context into grounded response
    Backend-->>Frontend: Streamed advice / analytical breakdown
```

---

## Key Features

- **Smart Receipt Scanning & OCR**: Upload receipt images to instantly extract merchant names, line items, dates, and total amounts using a combined OCR and vision parser with deterministic fallback rules.
- **Natural Language Ingestion**: Express transactions in plain text; MoneyMirror extracts the amount, currency, category, and date into a reviewable draft.
- **Human-in-the-Loop Safety Invariant**: Neither OCR nor AI drafts ever write directly to the database. All transactions require explicit user confirmation.
- **RAG Financial Chatbot**: A strictly read-only conversational assistant powered by `pgvector` and LLM integration (Gemini / Gemma compatible). Answers balance queries, computes category trends, and recommends spending reductions based solely on recorded transactions.
- **Activity Analytics & Cash Flow**: Real-time spending charts, category breakdown percentages, period filters (Month, Quarter, Year), and income vs. expense balance calculation.
- **KHAZI Fintech Design System**: A responsive UI built with Tailwind CSS, utilizing a calm and trustworthy palette (Forest Green `#14270B`, Lime `#B8E83D`, Mint `#D8ECEA`, Light Grey-Green `#F2F3EE`).
- **User Isolation & Multi-Tenancy**: Every database record, analytical aggregation, and vector similarity search is partitioned strictly by `user_id`.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | [Next.js 14](https://nextjs.org/) (App Router), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/), Radix UI |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com/), [Pydantic v2](https://docs.pydantic.dev/), [SQLModel](https://sqlmodel.tiangolo.com/) / [SQLAlchemy](https://www.sqlalchemy.org/) |
| **Database & Search** | [PostgreSQL 15](https://www.postgresql.org/) with [pgvector](https://github.com/pgvector/pgvector) |
| **Embeddings & OCR** | [FastEmbed](https://github.com/qdrant/fastembed) (`BAAI/bge-small-en-v1.5`), [RapidOCR](https://github.com/RapidAI/RapidOCR), Pillow |
| **AI / LLM** | Google Gemini / Gemma-compatible OpenAI API protocol |
| **DevOps & Monitoring** | [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/), [Prometheus](https://prometheus.io/), [Grafana](https://grafana.com/), [Alembic](https://alembic.sqlalchemy.org/) |

---

## Project Structure

```text
MoneyMirror-AI/
├── .env.example                 # Template for backend and frontend environment variables
├── docker-compose.yaml          # Multi-container orchestration (Next.js, FastAPI, pgvector)
├── Dockerfile.koyeb             # Container deployment target
├── Makefile                     # Helper commands (build, run, test, lint)
├── PRD.md                       # Product Requirements Document
├── design.md                    # Frontend visual & design system specifications
├── Readme.md                    # Project documentation & architecture overview
├── imgs/                        # Application UI screenshots and visual assets
│   ├── home.png                 # Home dashboard & balance overview
│   ├── scan-receipt.png         # Receipt scanning & OCR extraction view
│   ├── ai_agent.png             # AI assistant interface overview
│   └── chat.png                 # RAG financial assistant conversational chat
│
├── backend/                     # FastAPI Application
│   ├── Dockerfile               # Backend Dockerfile with FastEmbed pre-caching
│   ├── start.sh                 # Entrypoint script (runs migrations & seeds categories)
│   ├── tests/                   # Pytest test suite (isolation, idempotency, RAG safety)
│   └── api/
│       ├── app.py               # FastAPI application factory & middleware setup
│       ├── config.py            # Pydantic Settings & environment variable configuration
│       ├── database.py          # PostgreSQL session management & read-only session pool
│       ├── models.py            # Aggregated database models
│       ├── core/                # Core security, JWT auth, deps, ratelimiting, money logic
│       ├── public/              # Public API endpoints
│       │   ├── auth/            # Registration, login, JWT token generation
│       │   ├── categories/      # Category models, seeding, and user-defined tags
│       │   ├── transactions/    # Transaction CRUD, balances, and filters
│       │   ├── receipts/        # Receipt validation, OCR extraction, and parser
│       │   └── analytics/       # Cash flow, monthly stats, and category breakdowns
│       ├── ai/                  # AI Assistant Module
│       │   ├── models.py        # TransactionEmbedding pgvector model
│       │   ├── service.py       # Embedding generation & RAG context assembler
│       │   ├── tools.py         # ReadOnlyFinanceTools execution sandbox
│       │   └── routes.py        # Chatbot and natural language draft endpoints
│       └── alembic/             # Database schema migrations
│
├── frontend/                    # Next.js 14 Client Application
│   ├── Dockerfile               # Production Next.js Dockerfile
│   ├── package.json             # NPM dependencies & scripts
│   ├── tailwind.config.ts       # KHAZI color tokens and layout theme
│   └── src/
│       ├── app/                 # Next.js App Router (layout, page, globals.css)
│       ├── lib/                 # API client (lib/api.ts) and utility helpers
│       └── components/          # React components
│           ├── HomeView.tsx              # Dashboard: balance, quick actions, recent activity
│           ├── ActivityView.tsx          # Analytics: spending breakdown, period charts
│           ├── AddMoneyView.tsx          # Income/expense manual entry & presets
│           ├── ReceiptScanView.tsx       # Receipt upload, OCR preview, confirmation modal
│           ├── AIAssistantView.tsx       # Read-only RAG chatbot interface
│           ├── AuthModal.tsx             # Modal for login & account creation
│           ├── SettingsView.tsx          # User preferences and currency settings
│           ├── Sidebar.tsx               # Primary responsive navigation bar
│           └── TopBar.tsx                # Status indicator and user profile header
│
├── grafana/                     # Grafana provisioning & datasources
├── grafana_data/                # Grafana dashboards configuration
└── prometheus_data/             # Prometheus scrape configuration
```

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- *Or for local manual execution*: Python 3.11+, Node.js 18+, PostgreSQL 15 with the `pgvector` extension.

### Environment Variables

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Key environment configuration parameters:

```env
# Application Settings
ENV=development
SECRET_KEY=generate-a-strong-random-secret-key-here
DEFAULT_CURRENCY=MAD

# PostgreSQL with pgvector
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=moneymirror_db
POSTGRES_PORT=5454
DATABASE_URL=postgresql://user:password@localhost:5454/moneymirror_db

# AI & LLM Settings (Google Gemini / OpenAI compatible)
GEMMA_API_BASE=https://generativelanguage.googleapis.com/v1beta/openai/
GEMMA_API_KEY=your_gemini_api_key_here
GEMMA_MODEL=gemini-1.5-flash
EMBEDDINGS_ENABLED=true
OCR_ENABLED=true

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Running with Docker Compose (Recommended)

Start the complete stack (Frontend, Backend, and PostgreSQL with pgvector):

```bash
docker-compose up --build
```

Services will be accessible at:
- **Frontend**: [http://localhost:8080](http://localhost:8080)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL**: `localhost:5454`

### Running Locally for Development

#### 1. Backend

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r api/requirements.txt
pip install -r api/requirements-ml.txt

# Run migrations & seed categories
alembic -c api/alembic.ini upgrade head

# Start development server
uvicorn api.asgi:app --reload --host 0.0.0.0 --port 8000
```

#### 2. Frontend

```bash
# Navigate to frontend
cd frontend

# Install packages
npm install

# Start Next.js development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## API Reference

Interactive Swagger documentation is available at `/docs`. Below is a summary of core endpoints:

| Domain | Method | Endpoint | Description |
|---|---|---|---|
| **Health** | `GET` | `/api/health` | System health, version, and AI model status |
| **Auth** | `POST` | `/api/auth/register` | Register a new user |
| | `POST` | `/api/auth/token` | Obtain OAuth2 JWT access token |
| | `GET` | `/api/auth/me` | Fetch currently authenticated user profile |
| **Categories** | `GET` | `/api/categories` | List user and system-seeded categories |
| | `POST` | `/api/categories` | Create custom transaction category |
| **Transactions** | `GET` | `/api/transactions` | List transactions (filtering by type, date, category) |
| | `POST` | `/api/transactions` | **Confirm and save** a new transaction |
| | `GET` | `/api/transactions/summary` | Balance, total income, and total expenses |
| **Receipts** | `POST` | `/api/receipts/scan` | Scan receipt image and return an unpersisted `ReceiptDraft` |
| **AI Assistant**| `POST` | `/api/ai/transaction-draft`| Parse natural language text into a `ReceiptDraft` |
| | `POST` | `/api/ai/chat` | Read-only RAG financial assistant conversational query |
| | `GET` | `/api/ai/status` | Vector embeddings, OCR, and model engine readiness |
| **Analytics** | `GET` | `/api/analytics/monthly` | Monthly cash flow summaries |
| | `GET` | `/api/analytics/categories` | Category-level spending breakdown |

---

## Security & Design Principles

1. **Strict Human-in-the-Loop**:
   The `/api/receipts/scan` and `/api/ai/transaction-draft` endpoints **never write to the database**. They generate a transient draft for the user to review, correct, and explicitly commit.
2. **Read-Only RAG Safeguards**:
   The financial chatbot is equipped exclusively with `ReadOnlyFinanceTools`. It cannot create, edit, or delete transactions or categories.
3. **Multi-Tenant User Isolation**:
   Every query, calculation, and vector cosine search is scoped strictly to `user_id == current_user.id`. Users can never access or query other users' financial data.
4. **Input Sanitization & Quantization**:
   Financial amounts are represented with fixed-point `Decimal(12, 2)` precision to prevent floating-point rounding errors.

---

## Testing

The backend includes a comprehensive pytest suite covering authentication isolation, idempotency, read-only AI safety, and analytics calculations:

```bash
# Run pytest on the backend
pytest backend/tests/test_moneymirror.py -v
```

Tests include:
- `test_health_check`: Validates system status and AI configuration.
- `test_auth_and_user_isolation`: Ensures complete multi-tenant partition across users.
- `test_transaction_validation_and_idempotency`: Verifies input validation and duplicate prevention.
- `test_analytics_and_categories`: Validates correct category aggregations and cash flow sums.
- `test_ai_draft_never_creates_transaction`: Confirms that draft generation endpoints never write to the database.
- `test_chat_assistant_read_only`: Verifies that AI chatbot queries are strictly read-only and isolated.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.