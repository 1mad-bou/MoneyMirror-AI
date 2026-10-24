import os
import sys
from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

current_dir = os.path.dirname(os.path.realpath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.insert(0, project_root)
sys.path.insert(0, os.path.join(project_root, "api"))

from api.app import create_app
from api.config import test_settings
from api.database import get_db, readonly_session
from api.public.auth.models import User
from api.public.categories.crud import seed_default_categories
from api.public.categories.models import Category
from api.public.transactions.models import Transaction


@pytest.fixture(scope="module")
def client_and_engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    import api.models  # register tables
    SQLModel.metadata.create_all(engine)

    app = create_app(test_settings)

    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    # Seed categories
    with Session(engine) as session:
        seed_default_categories(session)

    client = TestClient(app)
    return client, engine


def test_health_check(client_and_engine):
    client, _ = client_and_engine
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"


def test_auth_and_user_isolation(client_and_engine):
    client, _ = client_and_engine

    # Register User A
    res_a = client.post(
        "/api/auth/register",
        json={"email": "alice@test.com", "password": "password123", "full_name": "Alice"},
    )
    assert res_a.status_code == 201
    token_a = res_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register User B
    res_b = client.post(
        "/api/auth/register",
        json={"email": "bob@test.com", "password": "password123", "full_name": "Bob"},
    )
    assert res_b.status_code == 201
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a transaction
    tx_res = client.post(
        "/api/transactions",
        headers=headers_a,
        json={
            "type": "expense",
            "amount": "150.50",
            "currency": "MAD",
            "description": "Alice Secret Grocery",
            "transaction_date": date.today().isoformat(),
        },
    )
    assert tx_res.status_code == 201
    tx_id = tx_res.json()["id"]

    # User B CANNOT see Alice's transaction by ID (404)
    res_leak = client.get(f"/api/transactions/{tx_id}", headers=headers_b)
    assert res_leak.status_code == 404

    # User B listing transactions sees 0 transactions
    res_list = client.get("/api/transactions", headers=headers_b)
    assert res_list.status_code == 200
    assert res_list.json()["total"] == 0

    # User B CANNOT delete Alice's transaction
    res_del = client.delete(f"/api/transactions/{tx_id}", headers=headers_b)
    assert res_del.status_code == 404

    # User A CAN see their own transaction
    res_alice = client.get(f"/api/transactions/{tx_id}", headers=headers_a)
    assert res_alice.status_code == 200
    assert res_alice.json()["amount"] == "150.50"


def test_transaction_validation_and_idempotency(client_and_engine):
    client, _ = client_and_engine

    # Login Alice
    res = client.post("/api/auth/login", json={"email": "alice@test.com", "password": "password123"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}", "Idempotency-Key": "unique-req-123"}

    # Invalid amount: negative or zero
    bad_res = client.post(
        "/api/transactions",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "type": "expense",
            "amount": "-50.00",
            "currency": "MAD",
            "description": "Invalid",
            "transaction_date": date.today().isoformat(),
        },
    )
    assert bad_res.status_code == 422

    # Invalid currency
    bad_curr = client.post(
        "/api/transactions",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "type": "expense",
            "amount": "50.00",
            "currency": "XYZ123",
            "description": "Invalid curr",
            "transaction_date": date.today().isoformat(),
        },
    )
    assert bad_curr.status_code == 422

    # Valid transaction with idempotency key
    create1 = client.post(
        "/api/transactions",
        headers=headers,
        json={
            "type": "expense",
            "amount": "200.00",
            "currency": "MAD",
            "description": "Dinner with friends",
            "transaction_date": date.today().isoformat(),
        },
    )
    assert create1.status_code == 201
    assert create1.json()["duplicate"] is False
    tx1_id = create1.json()["id"]

    # Retry with same idempotency key returns the SAME transaction with duplicate=True
    create2 = client.post(
        "/api/transactions",
        headers=headers,
        json={
            "type": "expense",
            "amount": "200.00",
            "currency": "MAD",
            "description": "Dinner with friends",
            "transaction_date": date.today().isoformat(),
        },
    )
    assert create2.status_code == 201
    assert create2.json()["duplicate"] is True
    assert create2.json()["id"] == tx1_id


def test_analytics_and_categories(client_and_engine):
    client, _ = client_and_engine

    res = client.post("/api/auth/login", json={"email": "alice@test.com", "password": "password123"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Add income
    client.post(
        "/api/transactions",
        headers=headers,
        json={
            "type": "income",
            "amount": "10000.00",
            "currency": "MAD",
            "description": "Monthly Salary",
            "transaction_date": date.today().isoformat(),
        },
    )

    # Check analytics summary
    sum_res = client.get("/api/analytics/summary", headers=headers)
    assert sum_res.status_code == 200
    data = sum_res.json()
    assert Decimal(data["primary_summary"]["total_income"]) >= Decimal("10000.00")
    assert Decimal(data["primary_summary"]["net_cash_flow"]) > Decimal("0")

    # Check categories
    cat_res = client.get("/api/categories", headers=headers)
    assert cat_res.status_code == 200
    assert len(cat_res.json()) >= 10


def test_ai_draft_never_creates_transaction(client_and_engine):
    client, _ = client_and_engine

    res = client.post("/api/auth/login", json={"email": "alice@test.com", "password": "password123"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Count transactions before
    count_before = client.get("/api/transactions", headers=headers).json()["total"]

    # Request NL draft
    draft_res = client.post(
        "/api/ai/transaction-draft",
        headers=headers,
        json={"text": "I spent 80 MAD on coffee today"},
    )
    assert draft_res.status_code == 200
    draft = draft_res.json()
    assert draft["amount"] == "80.00"
    assert draft["currency"] == "MAD"

    # Count transactions after MUST BE UNCHANGED
    count_after = client.get("/api/transactions", headers=headers).json()["total"]
    assert count_after == count_before


def test_chat_assistant_read_only(client_and_engine):
    client, _ = client_and_engine

    res = client.post("/api/auth/login", json={"email": "alice@test.com", "password": "password123"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Asking a question
    chat_res = client.post(
        "/api/ai/chat",
        headers=headers,
        json={"message": "Where did my money go?"},
    )
    assert chat_res.status_code == 200
    assert "reply" in chat_res.json()
    assert len(chat_res.json()["reply"]) > 10

