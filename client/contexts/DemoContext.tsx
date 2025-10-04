import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EvidenceSnippet } from '../types';

interface DemoContextType {
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  getSampleData: () => {
    cases: any[];
    evidence: EvidenceSnippet[];
  };
  getSampleCase: (caseId: string) => any | null;
  getSampleCaseEvidence: (caseId: string) => EvidenceSnippet[];
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within DemoProvider');
  }
  return context;
};

interface DemoProviderProps {
  children: ReactNode;
}

// Sample data for demo mode
const sampleEvidence: EvidenceSnippet[] = [
  {
    id: 'demo-1',
    type: 'message',
    source: 'WhatsApp',
    device: 'iPhone 12 Pro',
    timestamp: '2024-10-01T14:23:00Z',
    content: 'Meet me at the warehouse at midnight. Bring the package.',
    sha256: '7d8f9a3b4c1e2f5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
    confidence: 0.92,
    entities: [
      { type: 'location', value: 'warehouse' },
      { type: 'time', value: 'midnight' },
      { type: 'object', value: 'package' }
    ],
    location: { lat: 40.7128, lon: -74.0060 },
    case: 'demo-case-1',
    metadata: {
      sender: '+1-555-0123',
      recipient: '+1-555-0456'
    }
  },
  {
    id: 'demo-2',
    type: 'file',
    source: 'Gmail',
    device: 'Laptop - MacBook Pro',
    timestamp: '2024-09-28T09:15:00Z',
    content: 'Financial_Report_Q3_2024.xlsx - Contains suspicious transaction records totaling $2.5M',
    sha256: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
    confidence: 0.88,
    entities: [
      { type: 'money', value: '$2.5M' },
      { type: 'document', value: 'Financial_Report_Q3_2024.xlsx' }
    ],
    case: 'demo-case-1',
    metadata: {
      fileSize: '1.2 MB',
      mimeType: 'application/vnd.ms-excel'
    }
  },
  {
    id: 'demo-3',
    type: 'log',
    source: 'System Logs',
    device: 'Server - Ubuntu 20.04',
    timestamp: '2024-10-02T03:47:00Z',
    content: 'Unauthorized access attempt from IP 192.168.1.100 - Multiple failed login attempts detected',
    sha256: 'f9e8d7c6b5a4e3d2c1b0a9f8e7d6c5b4a3e2d1c0b9a8f7e6d5c4b3a2e1d0c9b8',
    confidence: 0.95,
    entities: [
      { type: 'ip_address', value: '192.168.1.100' },
      { type: 'security_event', value: 'unauthorized access' }
    ],
    case: 'demo-case-2',
    metadata: {
      severity: 'HIGH',
      attempts: 15
    }
  },
  {
    id: 'demo-4',
    type: 'message',
    source: 'Telegram',
    device: 'Android Phone',
    timestamp: '2024-09-30T18:30:00Z',
    content: 'The deal is off. They found out about the operation. Need to lay low for a while.',
    sha256: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2a3',
    confidence: 0.85,
    entities: [
      { type: 'activity', value: 'operation' },
      { type: 'action', value: 'lay low' }
    ],
    location: { lat: 51.5074, lon: -0.1278 },
    case: 'demo-case-1',
    metadata: {
      sender: '@suspect_alias',
      groupName: 'Business Associates'
    }
  },
  {
    id: 'demo-5',
    type: 'file',
    source: 'Cloud Storage',
    device: 'Google Drive',
    timestamp: '2024-09-25T12:00:00Z',
    content: 'blueprint_facility.pdf - Floor plans and security camera locations marked',
    sha256: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2a3b4',
    confidence: 0.91,
    entities: [
      { type: 'document', value: 'blueprint_facility.pdf' },
      { type: 'security', value: 'security camera locations' }
    ],
    case: 'demo-case-2',
    metadata: {
      owner: 'john.smith@company.com',
      sharedWith: ['suspicious@email.com']
    }
  },
  {
    id: 'demo-6',
    type: 'message',
    source: 'Email',
    device: 'Corporate Email Server',
    timestamp: '2024-09-22T16:45:00Z',
    content: 'RE: Project Falcon - Confirming unauthorized data transfer of 50GB to external server. Request immediate investigation.',
    sha256: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2a3b4c5',
    confidence: 0.94,
    entities: [
      { type: 'data_transfer', value: '50GB' },
      { type: 'project', value: 'Project Falcon' },
      { type: 'action', value: 'unauthorized data transfer' }
    ],
    case: 'demo-case-2',
    metadata: {
      from: 'security@techcorp.com',
      to: 'incident-response@techcorp.com',
      subject: 'RE: Project Falcon'
    }
  },
  {
    id: 'demo-7',
    type: 'file',
    source: 'Bank Records',
    device: 'Financial Database',
    timestamp: '2024-02-10T11:20:00Z',
    content: 'Transaction record showing $500,000 wire transfer to offshore account in Cayman Islands',
    sha256: 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2a3b4c5d6',
    confidence: 0.97,
    entities: [
      { type: 'money', value: '$500,000' },
      { type: 'location', value: 'Cayman Islands' },
      { type: 'transaction', value: 'wire transfer' }
    ],
    case: 'demo-case-3',
    metadata: {
      account_number: '****8732',
      transaction_id: 'TXN-2024-02-10-8732'
    }
  },
  {
    id: 'demo-8',
    type: 'message',
    source: 'SMS',
    device: 'iPhone 11',
    timestamp: '2024-02-15T14:30:00Z',
    content: 'Funds transferred successfully. Shell company setup complete. Destroy all evidence.',
    sha256: 'f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2a3b4c5d6e7',
    confidence: 0.96,
    entities: [
      { type: 'action', value: 'Destroy evidence' },
      { type: 'company', value: 'shell company' }
    ],
    case: 'demo-case-3',
    metadata: {
      phone: '+1-555-9876'
    }
  },
  {
    id: 'demo-9',
    type: 'log',
    source: 'Database Logs',
    device: 'MySQL Server',
    timestamp: '2024-09-29T22:15:00Z',
    content: 'SQL injection attempt detected. Attacker attempted to extract customer data from production database.',
    sha256: 'g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2a3b4c5d6e7f8',
    confidence: 0.93,
    entities: [
      { type: 'attack', value: 'SQL injection' },
      { type: 'data', value: 'customer data' }
    ],
    case: 'demo-case-2',
    metadata: {
      ip: '203.0.113.45',
      severity: 'CRITICAL'
    }
  },
  {
    id: 'demo-10',
    type: 'file',
    source: 'Forensic Image',
    device: 'Suspect Laptop',
    timestamp: '2024-03-01T10:00:00Z',
    content: 'Encrypted file archive containing financial spreadsheets. Decryption revealed detailed embezzlement records.',
    sha256: 'h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2a3b4c5d6e7f8g9',
    confidence: 0.99,
    entities: [
      { type: 'encryption', value: 'encrypted archive' },
      { type: 'evidence', value: 'embezzlement records' }
    ],
    case: 'demo-case-3',
    metadata: {
      encryption: 'AES-256',
      files_recovered: 342
    }
  }
];

const sampleCases = [
  {
    id: 'demo-case-1',
    name: 'Operation Dark Trade',
    case_number: 'DSDMC-2024-001',
    status: 'Active',
    lastModified: '2024-10-02T16:30:00Z',
    created_at: '2024-09-15T08:00:00Z',
    evidenceCount: 47,
    investigators: [
      { id: 1, first_name: 'Sarah', last_name: 'Johnson', email: 'sjohnson@agency.gov' },
      { id: 2, first_name: 'Mike', last_name: 'Chen', email: 'mchen@agency.gov' }
    ],
    description: 'Investigation into suspected illegal trade network operating across multiple states. Evidence suggests coordination between multiple criminal organizations.',
    priority: 'HIGH',
    category: 'Organized Crime',
    files: [
      {
        id: 'file-1',
        filename: 'evidence_package_001.ufdr',
        file_type: 'UFDR',
        uploaded_at: '2024-09-20T10:30:00Z',
        size: 2457600
      },
      {
        id: 'file-2',
        filename: 'surveillance_footage.mp4',
        file_type: 'Video',
        uploaded_at: '2024-09-25T14:15:00Z',
        size: 15728640
      }
    ]
  },
  {
    id: 'demo-case-2',
    name: 'Corporate Espionage - TechCorp',
    case_number: 'AVAR-2024-002',
    status: 'Active',
    lastModified: '2024-10-01T09:15:00Z',
    created_at: '2024-09-10T11:00:00Z',
    evidenceCount: 23,
    investigators: [
      { id: 3, first_name: 'Alex', last_name: 'Williams', email: 'awilliams@fbi.gov' },
      { id: 4, first_name: 'Maria', last_name: 'Rodriguez', email: 'mrodriguez@fbi.gov' }
    ],
    description: 'Data breach and theft of proprietary information from TechCorp headquarters. Investigation ongoing into potential insider threat.',
    priority: 'CRITICAL',
    category: 'Cybercrime',
    files: [
      {
        id: 'file-3',
        filename: 'network_logs.json',
        file_type: 'JSON',
        uploaded_at: '2024-09-28T09:00:00Z',
        size: 5242880
      }
    ]
  },
  {
    id: 'demo-case-3',
    name: 'Financial Fraud Investigation',
    case_number: 'DLDTB-2024-003',
    status: 'Closed',
    lastModified: '2024-09-15T14:20:00Z',
    created_at: '2024-01-05T09:00:00Z',
    evidenceCount: 156,
    investigators: [
      { id: 5, first_name: 'Lisa', last_name: 'Anderson', email: 'landerson@agency.gov' },
      { id: 6, first_name: 'Tom', last_name: 'Baker', email: 'tbaker@agency.gov' }
    ],
    description: 'Multi-million dollar embezzlement scheme involving shell companies. Case successfully closed with arrests made.',
    priority: 'HIGH',
    category: 'Financial Crime',
    files: [
      {
        id: 'file-4',
        filename: 'financial_records.csv',
        file_type: 'CSV',
        uploaded_at: '2024-01-10T13:00:00Z',
        size: 3145728
      },
      {
        id: 'file-5',
        filename: 'bank_statements.pdf',
        file_type: 'PDF',
        uploaded_at: '2024-02-05T16:30:00Z',
        size: 8388608
      }
    ]
  }
];

export const DemoProvider: React.FC<DemoProviderProps> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);

  const enterDemoMode = () => {
    setIsDemoMode(true);
    console.log('Demo mode activated');
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    console.log('Demo mode deactivated');
  };

  const getSampleData = () => {
    return {
      cases: sampleCases,
      evidence: sampleEvidence
    };
  };

  const getSampleCase = (caseId: string) => {
    return sampleCases.find(c => c.id === caseId) || null;
  };

  const getSampleCaseEvidence = (caseId: string) => {
    return sampleEvidence.filter(e => e.case === caseId);
  };

  const value: DemoContextType = {
    isDemoMode,
    enterDemoMode,
    exitDemoMode,
    getSampleData,
    getSampleCase,
    getSampleCaseEvidence
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};

