/**
 * API Service for backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Token management
export const tokenManager = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  },
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  setUser: (user: any) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
};

// Get CSRF token from cookies
function getCsrfToken(): string | null {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(name + '=')) {
      return decodeURIComponent(trimmed.substring(name.length + 1));
    }
  }
  return null;
}

// Helper function for API calls with automatic token refresh
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  skipAuth: boolean = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add JWT token for authenticated requests
  if (!skipAuth) {
    const token = tokenManager.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Add CSRF token for non-GET requests
  const method = options.method || 'GET';
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
  }

  // Merge headers properly
  const mergedHeaders = {
    ...headers,
    ...(options.headers as Record<string, string> || {}),
  };

  const defaultOptions: RequestInit = {
    ...options,
    headers: mergedHeaders,
    credentials: 'include',
  };

  // Remove Content-Type for FormData but keep other headers
  if (options.body instanceof FormData) {
    delete defaultOptions.headers!['Content-Type'];
  }

  let response = await fetch(url, defaultOptions);

  // Handle 401 - Try to refresh token
  if (response.status === 401 && !skipAuth && !endpoint.includes('/auth/')) {
    const refreshToken = tokenManager.getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          tokenManager.setTokens(data.access, data.refresh);
          
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${data.access}`;
          response = await fetch(url, { ...defaultOptions, headers });
        } else {
          // Refresh failed, clear tokens and redirect to login
          tokenManager.clearTokens();
          window.location.href = '/';
          throw new Error('Session expired. Please login again.');
        }
      } catch (error) {
        tokenManager.clearTokens();
        window.location.href = '/';
        throw new Error('Session expired. Please login again.');
      }
    } else {
      tokenManager.clearTokens();
      window.location.href = '/';
      throw new Error('Authentication required.');
    }
  }

  if (!response.ok) {
    // Try to parse error as JSON, fallback to text if that fails
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorData.error || JSON.stringify(errorData);
    } catch {
      // If JSON parsing fails, try to get text
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// Cases API
export const casesApi = {
  list: async () => {
    const response = await apiCall<any>('/cases/');
    // Handle paginated response from DRF
    return response.results || response;
  },
  get: (id: string) => apiCall<any>(`/cases/${id}/`),
  create: (data: any) => apiCall<any>('/cases/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  uploadFile: (caseId: string, file: File, fileType: string = 'UFDR') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);

    return apiCall<any>(`/cases/${caseId}/upload_file/`, {
      method: 'POST',
      body: formData,
    });
  },
  getEvidence: (caseId: string) => apiCall<any[]>(`/cases/${caseId}/evidence/`),
  stats: () => apiCall<any>('/cases/stats/'),
  
  // Status Management
  markActive: (caseId: string) => apiCall<any>(`/cases/${caseId}/mark_active/`, {
    method: 'POST',
  }),
  markClosed: (caseId: string) => apiCall<any>(`/cases/${caseId}/mark_closed/`, {
    method: 'POST',
  }),
  markArchived: (caseId: string) => apiCall<any>(`/cases/${caseId}/mark_archived/`, {
    method: 'POST',
  }),
  changeStatus: (caseId: string, status: 'Active' | 'Closed' | 'Archived') => 
    apiCall<any>(`/cases/${caseId}/change_status/`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  delete: (caseId: string) => apiCall<any>(`/cases/${caseId}/`, {
    method: 'DELETE',
  }),
};

// Evidence API
export const evidenceApi = {
  list: async (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    const response = await apiCall<any>(`/evidence/items/${query}`);
    return response.results || response;
  },
  search: (query: string, caseId?: string) => {
    const params = new URLSearchParams({ q: query });
    if (caseId) params.append('case_id', caseId);
    return apiCall<{
      query: string;
      total_results: number;
      results: any[];
      ai_summary?: string;
      search_suggestions?: Array<{
        text: string;
        type: string;
        count: number;
      }>;
    }>(`/evidence/items/search/?${params}`);
  },
  stats: (caseId?: string) => {
    const query = caseId ? `?case_id=${caseId}` : '';
    return apiCall<any>(`/evidence/items/stats/${query}`);
  },
  entities: async (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    const response = await apiCall<any>(`/evidence/entities/${query}`);
    return response.results || response;
  },
  graphData: (caseId: string) => {
    return apiCall<{ nodes: any[]; edges: any[] }>(
      `/evidence/connections/graph_data/?case_id=${caseId}`
    );
  },
};

// AI Analysis API
export const aiApi = {
  ask: (query: string, caseId: string, options?: { conversation_history?: Array<{query: string, response: string}> }) => {
    return apiCall<any>('/ai/queries/ask/', {
      method: 'POST',
      body: JSON.stringify({ 
        query, 
        case_id: caseId,
        conversation_history: options?.conversation_history || []
      }),
    });
  },
  listQueries: async (caseId?: string) => {
    const query = caseId ? `?case_id=${caseId}` : '';
    const response = await apiCall<any>(`/ai/queries/${query}`);
    return response.results || response;
  },
  generateInsights: (caseId: string) => {
    return apiCall<any>('/ai/insights/generate/', {
      method: 'POST',
      body: JSON.stringify({ case_id: caseId }),
    });
  },
  listInsights: async (caseId?: string) => {
    const query = caseId ? `?case_id=${caseId}` : '';
    const response = await apiCall<any>(`/ai/insights/${query}`);
    return response.results || response;
  },
  analyzeCaseOnLoad: (caseId: string) => {
    return apiCall<any>('/ai/queries/analyze_case_on_load/', {
      method: 'POST',
      body: JSON.stringify({ case_id: caseId }),
    });
  },
  getAutocompleteEntities: (caseId: string, entityType?: string, pattern?: string) => {
    return apiCall<any>('/ai/queries/get_autocomplete_entities/', {
      method: 'POST',
      body: JSON.stringify({ 
        case_id: caseId,
        entity_type: entityType,
        pattern: pattern
      }),
    });
  },
  testHypothesis: (caseId: string, hypothesis: string) => {
    return apiCall<any>('/ai/queries/test_hypothesis/', {
      method: 'POST',
      body: JSON.stringify({
        case_id: caseId,
        hypothesis: hypothesis
      }),
    });
  },
};

// Chat Sessions API - FlowBot conversation persistence
export const chatSessionsApi = {
  list: async (caseId: string) => {
    const response = await apiCall<any>(`/ai/chat-sessions/list_for_case/?case_id=${caseId}`);
    return response;
  },
  create: (caseId: string, hypothesisMode: boolean = false, hypothesisText: string = '') => {
    return apiCall<any>('/ai/chat-sessions/', {
      method: 'POST',
      body: JSON.stringify({
        case: caseId,
        hypothesis_mode: hypothesisMode,
        hypothesis_text: hypothesisText,
      }),
    });
  },
  get: (sessionId: string) => {
    return apiCall<any>(`/ai/chat-sessions/${sessionId}/`);
  },
  addMessage: (sessionId: string, data: {
    message_type: 'user' | 'bot' | 'system';
    content: string;
    metadata?: any;
    evidence_ids?: string[];
    confidence_score?: number;
    processing_time?: number;
  }) => {
    return apiCall<any>(`/ai/chat-sessions/${sessionId}/add_message/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  generateTitle: (sessionId: string) => {
    return apiCall<any>(`/ai/chat-sessions/${sessionId}/generate_title/`, {
      method: 'POST',
    });
  },
  archive: (sessionId: string) => {
    return apiCall<any>(`/ai/chat-sessions/${sessionId}/archive/`, {
      method: 'DELETE',
    });
  },
};

// Reports API
export const reportsApi = {
  list: async (caseId?: string) => {
    const query = caseId ? `?case_id=${caseId}` : '';
    const response = await apiCall<any>(`/reports/${query}`);
    return response.results || response;
  },
  generate: (caseId: string, reportType: string, title?: string, format: string = 'pdf') => {
    return apiCall<any>('/reports/generate/', {
      method: 'POST',
      body: JSON.stringify({
        case_id: caseId,
        report_type: reportType,
        title,
        format,
      }),
    });
  },
  export: (reportId: string) => {
    return apiCall<any>(`/reports/${reportId}/export/`);
  },
};

// Report Items API - Pin to Report functionality
export const reportItemsApi = {
  // Pin an AI response to the report
  pinAIResponse: (data: {
    case_id: string;
    title: string;
    content: string;
    query_id?: number;
    evidence_ids?: string[];
    section?: string;
    metadata?: any;
  }) => {
    return apiCall<any>('/ai/report-items/pin_ai_response/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Pin an evidence item to the report
  pinEvidence: (data: {
    case_id: string;
    evidence_id: string;
    title: string;
    content: string;
    section?: string;
    metadata?: any;
  }) => {
    return apiCall<any>('/ai/report-items/pin_evidence/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get all report items for a case, grouped by section
  getSections: (caseId: string) => {
    return apiCall<any>(`/ai/report-items/sections/?case_id=${caseId}`);
  },

  // Get all report items for a case
  list: (caseId: string) => {
    return apiCall<any>(`/ai/report-items/?case_id=${caseId}`);
  },

  // Delete a report item
  delete: (itemId: string) => {
    return apiCall<any>(`/ai/report-items/${itemId}/`, {
      method: 'DELETE',
    });
  },

  // Reorder items within a section
  reorder: (caseId: string, section: string, itemOrders: Array<{id: number, order: number}>) => {
    return apiCall<any>('/ai/report-items/reorder/', {
      method: 'POST',
      body: JSON.stringify({
        case_id: caseId,
        section: section,
        item_orders: itemOrders,
      }),
    });
  },
};

// Audit API
export const auditApi = {
  list: async (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    const response = await apiCall<any>(`/audit/${query}`);
    return response.results || response;
  },
  stats: () => apiCall<any>('/audit/stats/'),
};

// Authentication API
export const authApi = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    employee_id?: string;
    department?: string;
    phone_number?: string;
  }) => apiCall<any>('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(data),
  }, true),

  login: async (username: string, password: string) => {
    const response = await apiCall<any>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }, true);
    
    // Store tokens and user data
    if (response.tokens) {
      tokenManager.setTokens(response.tokens.access, response.tokens.refresh);
    }
    if (response.user) {
      tokenManager.setUser(response.user);
    }
    
    return response;
  },

  logout: async () => {
    try {
      await apiCall<any>('/auth/logout/', { method: 'POST' });
    } finally {
      tokenManager.clearTokens();
    }
  },

  getProfile: () => apiCall<any>('/auth/profile/'),

  updateProfile: (data: any) => apiCall<any>('/auth/profile/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  changePassword: (oldPassword: string, newPassword: string, newPasswordConfirm: string) => 
    apiCall<any>('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      }),
    }),

  refreshToken: async () => {
    const refresh = tokenManager.getRefreshToken();
    if (!refresh) throw new Error('No refresh token');
    
    const response = await apiCall<any>('/auth/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    }, true);
    
    tokenManager.setTokens(response.access, response.refresh);
    return response;
  },

  // Admin only
  listUsers: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiCall<any>(`/auth/users/${query}`);
  },

  approveUser: (userId: number) => 
    apiCall<any>(`/auth/users/${userId}/approve/`, { method: 'POST' }),

  rejectUser: (userId: number) => 
    apiCall<any>(`/auth/users/${userId}/reject/`, { method: 'POST' }),

  changeUserRole: (userId: number, role: string) => 
    apiCall<any>(`/auth/users/${userId}/change_role/`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  getUserStats: () => apiCall<any>('/auth/users/statistics/'),

  getPendingApprovals: () => apiCall<any>('/auth/users/pending_approvals/'),

  getLoginHistory: () => apiCall<any>('/auth/login-history/'),

  // Password reset
  requestPasswordReset: (email: string) => 
    apiCall<any>('/auth/password-reset/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, true),

  confirmPasswordReset: (uidb64: string, token: string, newPassword: string, newPasswordConfirm: string) => 
    apiCall<any>('/auth/password-reset/confirm/', {
      method: 'POST',
      body: JSON.stringify({
        uidb64,
        token,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      }),
    }, true),

  // Bulk operations
  bulkApproveUsers: (userIds: number[]) =>
    apiCall<any>('/auth/users/bulk_approve/', {
      method: 'POST',
      body: JSON.stringify({ user_ids: userIds }),
    }),

  bulkRejectUsers: (userIds: number[]) =>
    apiCall<any>('/auth/users/bulk_reject/', {
      method: 'POST',
      body: JSON.stringify({ user_ids: userIds }),
    }),

  bulkDeleteUsers: (userIds: number[]) =>
    apiCall<any>('/auth/users/bulk_delete/', {
      method: 'POST',
      body: JSON.stringify({ user_ids: userIds }),
    }),

  bulkChangeRole: (userIds: number[], role: string) =>
    apiCall<any>('/auth/users/bulk_change_role/', {
      method: 'POST',
      body: JSON.stringify({ user_ids: userIds, role }),
    }),
};

