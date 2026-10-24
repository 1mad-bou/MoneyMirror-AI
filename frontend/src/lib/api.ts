// API Client and Type Definitions for MoneyMirror AI

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '');

const TOKEN_KEY = 'moneymirror_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// ---------------------------------------------------------------------------
// Domain Interfaces
// ---------------------------------------------------------------------------

export interface User {
  id: number;
  email: string;
  full_name: string;
  preferred_currency: string;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  kind: 'expense' | 'income';
  icon?: string | null;
  is_default?: boolean;
}

export interface CategoryBrief {
  id: number;
  name: string;
  icon?: string | null;
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: string;
  currency: string;
  description: string;
  merchant?: string | null;
  category_id?: number | null;
  category?: CategoryBrief | null;
  transaction_date: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreatePayload {
  type: 'income' | 'expense';
  amount: string;
  currency: string;
  description: string;
  merchant?: string;
  category_id?: number;
  transaction_date: string;
  source?: string;
}

export interface TransactionUpdatePayload {
  type?: 'income' | 'expense';
  amount?: string;
  currency?: string;
  description?: string;
  merchant?: string | null;
  category_id?: number | null;
  transaction_date?: string;
}

export interface TransactionPage {
  items: Transaction[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ReceiptItem {
  description: string;
  amount?: string | null;
  quantity?: number | null;
}

export interface ReceiptDraft {
  merchant?: string | null;
  transaction_date?: string | null;
  amount?: string | null;
  currency: string;
  description: string;
  suggested_category_id?: number | null;
  suggested_category_name?: string | null;
  type: 'income' | 'expense';
  subtotal?: string | null;
  tax?: string | null;
  items?: ReceiptItem[];
  raw_text?: string;
  confidence?: number;
  warnings?: string[];
}

export interface CurrencySummary {
  currency: string;
  total_income: string;
  total_expenses: string;
  net_cash_flow: string;
  transaction_count: number;
}

export interface CategorySpending {
  category_id?: number | null;
  category_name: string;
  category_icon?: string | null;
  currency: string;
  amount: string;
  percentage: number;
  count: number;
}

export interface TopMerchant {
  merchant: string;
  currency: string;
  amount: string;
  count: number;
}

export interface DashboardSummary {
  preferred_currency: string;
  currencies: CurrencySummary[];
  primary_summary: CurrencySummary;
  top_categories: CategorySpending[];
  top_merchants: TopMerchant[];
  total_transactions: number;
}

export interface TrendPoint {
  date: string;
  currency: string;
  income: string;
  expenses: string;
  net: string;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  user: User;
}

export interface AIStatus {
  gemma_configured: boolean;
  gemma_model: string;
  ocr_enabled: boolean;
  embeddings_enabled: boolean;
  embedding_model?: string;
}

export interface ChatResponse {
  reply: string;
}

// ---------------------------------------------------------------------------
// Request Helper
// ---------------------------------------------------------------------------

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers || {});

  const token = getToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Only set application/json if not sending FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        errorMessage =
          typeof errorJson.detail === 'string'
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
      } else if (errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // Non-JSON error response
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// API Methods
// ---------------------------------------------------------------------------

export const api = {
  // Authentication
  async register(data: { email: string; password: string; full_name?: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async me(): Promise<User> {
    return request<User>('/api/auth/me', {
      method: 'GET',
    });
  },

  async updateMe(data: { full_name?: string; preferred_currency?: string }): Promise<User> {
    return request<User>('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Categories
  async getCategories(kind?: 'expense' | 'income'): Promise<Category[]> {
    const query = kind ? `?kind=${encodeURIComponent(kind)}` : '';
    return request<Category[]>(`/api/categories${query}`, {
      method: 'GET',
    });
  },

  async createCategory(data: { name: string; kind: 'expense' | 'income'; icon?: string }): Promise<Category> {
    return request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteCategory(id: number): Promise<void> {
    await request<void>(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Dashboard & Analytics
  async getSummary(currency?: string, startDate?: string, endDate?: string): Promise<DashboardSummary> {
    const params = new URLSearchParams();
    if (currency) params.set('currency', currency);
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<DashboardSummary>(`/api/analytics/summary${qs}`, {
      method: 'GET',
    });
  },

  async getTrends(currency?: string, period: string = '30d'): Promise<TrendPoint[]> {
    const params = new URLSearchParams();
    if (currency) params.set('currency', currency);
    if (period) params.set('period', period);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<TrendPoint[]>(`/api/analytics/trends${qs}`, {
      method: 'GET',
    });
  },

  async getCategoryBreakdown(currency?: string, kind: 'expense' | 'income' = 'expense'): Promise<CategorySpending[]> {
    const params = new URLSearchParams();
    if (currency) params.set('currency', currency);
    params.set('kind', kind);
    return request<CategorySpending[]>(`/api/analytics/categories?${params.toString()}`, {
      method: 'GET',
    });
  },

  // Transactions
  async getTransactions(params: {
    page?: number;
    size?: number;
    currency?: string;
    search?: string;
    type?: string;
    category_id?: number;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<TransactionPage> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set('page', String(params.page));
    if (params.size !== undefined) searchParams.set('size', String(params.size));
    if (params.currency) searchParams.set('currency', params.currency);
    if (params.search) searchParams.set('search', params.search);
    if (params.type) searchParams.set('type', params.type);
    if (params.category_id !== undefined) searchParams.set('category_id', String(params.category_id));
    if (params.start_date) searchParams.set('start_date', params.start_date);
    if (params.end_date) searchParams.set('end_date', params.end_date);

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<TransactionPage>(`/api/transactions${qs}`, {
      method: 'GET',
    });
  },

  async createTransaction(
    payload: TransactionCreatePayload,
    idempotencyKey?: string
  ): Promise<Transaction> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return request<Transaction>('/api/transactions', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  },

  async updateTransaction(
    id: number,
    payload: TransactionUpdatePayload
  ): Promise<Transaction> {
    return request<Transaction>(`/api/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteTransaction(id: number): Promise<void> {
    await request<void>(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  // Receipt Scanner
  async scanReceipt(file: File): Promise<ReceiptDraft> {
    const formData = new FormData();
    formData.append('file', file);

    return request<ReceiptDraft>('/api/receipts/scan', {
      method: 'POST',
      body: formData,
    });
  },

  // AI & Assistant
  async getNLDraft(text: string): Promise<ReceiptDraft> {
    return request<ReceiptDraft>('/api/ai/transaction-draft', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async chat(message: string): Promise<ChatResponse> {
    return request<ChatResponse>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  async getAIStatus(): Promise<AIStatus> {
    return request<AIStatus>('/api/ai/status', {
      method: 'GET',
    });
  },
};

