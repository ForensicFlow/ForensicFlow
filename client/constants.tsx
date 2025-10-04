
import React from 'react';
import { AppView, EvidenceSnippet, Case, Report, AuditLogEntry } from './types';
import { SearchIcon, FolderIcon, ClockIcon, ShareIcon, DocumentReportIcon, CogIcon, ShieldCheckIcon, SparklesIcon } from './components/icons';

export const NAV_ITEMS = [
  { view: AppView.SEARCH, label: 'Search', icon: <SearchIcon className="h-6 w-6" /> },
  { view: AppView.CASES, label: 'Cases', icon: <FolderIcon className="h-6 w-6" /> },
  { view: AppView.SETTINGS, label: 'Settings', icon: <CogIcon className="h-6 w-6" /> },
];

// Case-specific tab items
export const CASE_TAB_ITEMS = [
  { view: 'evidence', label: 'Evidence', icon: <FolderIcon className="h-5 w-5" /> },
  { view: 'flowbot', label: 'FlowBot AI', icon: <SparklesIcon className="h-5 w-5" /> },
  { view: 'timeline', label: 'Timeline', icon: <ClockIcon className="h-5 w-5" /> },
  { view: 'network', label: 'Network', icon: <ShareIcon className="h-5 w-5" /> },
  { view: 'reports', label: 'Reports', icon: <DocumentReportIcon className="h-5 w-5" /> },
  { view: 'audit', label: 'Audit', icon: <ShieldCheckIcon className="h-5 w-5" /> },
];

export const MOCK_EVIDENCE_DATA: EvidenceSnippet[] = [
  {
    id: 'msg_001',
    type: 'message',
    source: 'Message from +91 98xxxx',
    device: 'Device A (SM-G998B)',
    timestamp: '2025-03-12T14:32:10Z',
    content: "Ok, transfer 0.15 BTC from 3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy to the new hardware wallet. I'll send the address separately.",
    sha256: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    confidence: 0.92,
    entities: [
      { type: 'Crypto', value: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy' },
      { type: 'Amount', value: '0.15 BTC' },
      { type: 'Person', value: '+91 98xxxx' },
    ],
    location: { lat: 28.6139, lon: 77.2090 }
  },
  {
    id: 'file_002',
    type: 'file',
    source: 'IMG_20250312_184501.jpg',
    device: 'Device B (iPhone 14 Pro)',
    timestamp: '2025-03-12T18:45:01Z',
    content: "Image containing GPS EXIF data and a partial view of a shipping manifest.",
    sha256: 'f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9',
    confidence: 0.85,
    entities: [
      { type: 'GPS', value: '40.7128° N, 74.0060° W' },
      { type: 'Document', value: 'Shipping Manifest' },
      { type: 'Location', value: 'New York Harbor' },
    ]
  },
  {
    id: 'msg_003',
    type: 'message',
    source: 'Chat with "The Fixer"',
    device: 'Device A (SM-G998B)',
    timestamp: '2025-03-13T09:15:44Z',
    content: "The package is secure. Meet at the usual spot, Pier 4. Don't be late. Use the code word 'Zephyr'.",
    sha256: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    confidence: 0.98,
    entities: [
      { type: 'Location', value: 'Pier 4' },
      { type: 'Codeword', value: 'Zephyr' },
      { type: 'Person', value: 'The Fixer' },
    ]
  },
    {
    id: 'log_004',
    type: 'log',
    source: 'system_logs.txt',
    device: 'Server-01',
    timestamp: '2025-03-14T02:01:19Z',
    content: "User 'admin' failed login attempt from IP 203.0.113.75. Port 22.",
    sha256: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
    confidence: 0.76,
    entities: [
      { type: 'IP Address', value: '203.0.113.75' },
      { type: 'Username', value: 'admin' },
    ]
  },
];

export const MOCK_CASES: Case[] = [
  {
    id: 'case-001',
    name: 'Operation Zephyr',
    status: 'Active',
    lastModified: '2025-03-15T10:00:00Z',
    evidenceCount: 4,
    investigators: ['Jane Doe', 'John Smith'],
  },
  {
    id: 'case-002',
    name: 'Project Chimera',
    status: 'Active',
    lastModified: '2025-03-14T12:30:00Z',
    evidenceCount: 128,
    investigators: ['Jane Doe', 'Emily White'],
  },
  {
    id: 'case-003',
    name: 'Crypto-Heist Investigation',
    status: 'Closed',
    lastModified: '2025-01-20T18:00:00Z',
    evidenceCount: 2041,
    investigators: ['John Smith'],
  },
  {
    id: 'case-004',
    name: 'Internal Data Breach',
    status: 'Archived',
    lastModified: '2024-11-11T11:11:11Z',
    evidenceCount: 512,
    investigators: ['Emily White'],
  },
];

export const MOCK_REPORTS: Report[] = [
  {
    id: 'rep-001',
    title: 'Initial Findings: Operation Zephyr',
    caseId: 'case-001',
    createdBy: 'Jane Doe',
    createdAt: '2025-03-14T17:00:00Z',
    version: 1,
  },
  {
    id: 'rep-002',
    title: 'Final Report: Crypto-Heist',
    caseId: 'case-003',
    createdBy: 'John Smith',
    createdAt: '2025-01-19T09:00:00Z',
    version: 3,
  },
   {
    id: 'rep-003',
    title: 'Timeline Analysis: Project Chimera',
    caseId: 'case-002',
    createdBy: 'Emily White',
    createdAt: '2025-03-13T14:20:00Z',
    version: 1,
  },
];

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-001',
    timestamp: '2025-03-15T10:02:15Z',
    user: 'Jane Doe',
    action: 'EXPORT_REPORT',
    details: 'Exported "Initial Findings: Operation Zephyr" (PDF)',
    ipAddress: '192.168.1.101',
  },
  {
    id: 'log-002',
    timestamp: '2025-03-15T09:55:41Z',
    user: 'John Smith',
    action: 'VIEW_EVIDENCE',
    details: 'Viewed evidence snippet msg_001',
    ipAddress: '198.51.100.23',
  },
  {
    id: 'log-003',
    timestamp: '2025-03-15T09:30:05Z',
    user: 'Jane Doe',
    action: 'RUN_SEARCH',
    details: 'Searched for "wallet"',
    ipAddress: '192.168.1.101',
  },
  {
    id: 'log-004',
    timestamp: '2025-03-14T11:21:00Z',
    user: 'admin',
    action: 'ADD_USER',
    details: 'Added user "Emily White" to case "Project Chimera"',
    ipAddress: '127.0.0.1',
  },
  {
    id: 'log-005',
    timestamp: '2025-03-14T10:00:00Z',
    user: 'SYSTEM',
    action: 'INGEST_DATA',
    details: 'Ingested 4 new evidence items into "Operation Zephyr"',
    ipAddress: 'N/A',
  },
];

export const MOCK_USER_PROFILE = {
    name: 'Jane Doe',
    email: 'jane.doe@agency.gov',
    role: 'Lead Investigator',
    avatarUrl: `https://i.pravatar.cc/150?u=jane.doe`,
};
