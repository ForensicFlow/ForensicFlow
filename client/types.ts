
export interface EvidenceSnippet {
  id: string;
  type: 'message' | 'file' | 'log';
  source: string;
  device: string;
  timestamp: string;
  content: string;
  sha256: string;
  confidence: number;
  entities: { type: string; value: string }[];
  location?: { lat: number; lon: number };
  case?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export enum AppView {
  SEARCH,
  CASES,
  CASE_DETAIL,
  SETTINGS,
  USER_MANAGEMENT,
}

export enum CaseTabView {
  EVIDENCE,
  FLOWBOT,
  TIMELINE,
  NETWORK,
  REPORTS,
  AUDIT,
}

export interface Investigator {
  id?: number;
  first_name: string;
  last_name: string;
  email?: string;
}

export interface Case {
  id: string;
  name: string;
  case_number?: string;
  status: 'Active' | 'Archived' | 'Closed';
  lastModified?: string; // Made optional to handle missing dates
  last_modified?: string; // Backend snake_case variant
  updated_at?: string; // Alternative backend field
  created_at?: string;
  evidenceCount?: number; // Frontend camelCase
  evidence_count?: number; // Backend snake_case
  investigators: string[] | Investigator[];
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category?: string;
  files?: Array<{
    id: string;
    filename: string;
    file_type: string;
    uploaded_at: string;
    size: number;
  }>;
}

export interface Report {
  id: string;
  title: string;
  caseId: string;
  createdBy: string;
  createdAt: string;
  version: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  ipAddress: string;
}

export interface ChatMessage {
  id: string;
  message_type: 'user' | 'bot' | 'system';
  content: string;
  created_at: string;
  evidence_ids?: string[];
  confidence_score?: number;
  processing_time?: number;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  case: string;
  user: string;
  user_name?: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  is_active: boolean;
  message_count: number;
  hypothesis_mode: boolean;
  hypothesis_text: string;
  message_preview?: string;
  messages?: ChatMessage[];
}
