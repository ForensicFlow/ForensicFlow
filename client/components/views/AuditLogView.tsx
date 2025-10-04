
import React, { useState, useEffect } from 'react';
import { auditApi } from '@/lib/api';
import { AuditLogEntry } from '../../types';
import { SearchIcon, DocumentReportIcon, UserCircleIcon, CogIcon } from '../icons';
import { useDemo } from '@/contexts/DemoContext';

const getIconForAction = (action: string) => {
    if (action.includes('USER')) return <UserCircleIcon className="h-5 w-5" />;
    if (action.includes('REPORT')) return <DocumentReportIcon className="h-5 w-5" />;
    if (action.includes('SEARCH')) return <SearchIcon className="h-5 w-5" />;
    return <CogIcon className="h-5 w-5" />;
};

interface AuditLogViewProps {
    caseId: string;
}

const AuditLogView: React.FC<AuditLogViewProps> = ({ caseId }) => {
    const { isDemoMode } = useDemo();
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadLogs = async () => {
            try {
                setLoading(true);
                setError(null);

                if (isDemoMode) {
                    // Use sample audit logs in demo mode
                    const sampleLogs: AuditLogEntry[] = [
                        {
                            id: 'audit-demo-1',
                            timestamp: '2024-10-02T14:30:00Z',
                            user: 'Demo Investigator',
                            action: 'VIEW_EVIDENCE',
                            details: 'Viewed evidence item "WhatsApp message from +1-555-0123"',
                            ipAddress: '192.168.1.100',
                        },
                        {
                            id: 'audit-demo-2',
                            timestamp: '2024-10-02T14:25:00Z',
                            user: 'Demo Analyst',
                            action: 'RUN_SEARCH',
                            details: 'Searched for "crypto" in case evidence',
                            ipAddress: '192.168.1.101',
                        },
                        {
                            id: 'audit-demo-3',
                            timestamp: '2024-10-02T14:20:00Z',
                            user: 'Demo Investigator',
                            action: 'VIEW_TIMELINE',
                            details: 'Accessed case timeline view',
                            ipAddress: '192.168.1.100',
                        },
                    ];
                    setLogs(sampleLogs);
                } else {
                    // Load audit logs for specific case from API
                    const data = await auditApi.list({ case_id: caseId });
                    setLogs(data);
                }
            } catch (error) {
                console.error('Error loading audit logs:', error);
                if (isDemoMode) {
                    setError('Demo mode: Unable to load sample audit logs');
                } else {
                    setError('Failed to load audit logs. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };
        loadLogs();
    }, [caseId, isDemoMode]);

    return (
        <div className="p-6 lg:p-8">
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white">Audit Log</h1>
                    {isDemoMode && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full">
                            DEMO MODE
                        </span>
                    )}
                </div>
                <p className="text-slate-400">
                    {isDemoMode
                        ? "An immutable log of sample actions taken for this demo case."
                        : "An immutable log of all actions taken for this case to maintain chain-of-custody."
                    }
                </p>
            </div>

            {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500 rounded-md p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-white">Loading audit logs...</div>
                </div>
            ) : logs.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/20 backdrop-blur-lg">
                    <table className="min-w-full divide-y divide-slate-700/50">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">Timestamp</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">User</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Action</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Details</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-800/40">
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono text-cyan-300 sm:pl-6">{new Date(log.timestamp).toISOString()}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">{log.user}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400">{getIconForAction(log.action)}</span>
                                            <span className="font-semibold">{log.action}</span>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300 max-w-xs truncate">{log.details}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-slate-400">{log.ipAddress}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-20 text-slate-400 rounded-lg border border-dashed border-slate-700">
                    <p className="font-semibold">No audit logs found.</p>
                    <p className="text-sm mt-1">Activity will appear here as actions are performed.</p>
                </div>
            )}
        </div>
    );
};

export default AuditLogView;
