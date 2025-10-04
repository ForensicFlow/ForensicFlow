
import React, { useState, useEffect } from 'react';
import { reportsApi, reportItemsApi } from '@/lib/api';
import { Report } from '../../types';
import { PlusIcon, EyeIcon, DocumentDownloadIcon, PencilIcon, TrashIcon } from '../icons';
import { useDemo } from '@/contexts/DemoContext';
import { useToast } from '@/contexts/ToastContext';
import MarkdownRenderer from '../MarkdownRenderer';

interface ReportsViewProps {
    caseId: string;
}

const ReportsView: React.FC<ReportsViewProps> = ({ caseId }) => {
    const { isDemoMode } = useDemo();
    const { success, error: showError } = useToast();
    const [reports, setReports] = useState<Report[]>([]);
    const [pinnedItems, setPinnedItems] = useState<any>({ sections: {}, total_items: 0 });
    const [loading, setLoading] = useState(true);
    const [loadingPinned, setLoadingPinned] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<string>('findings');

    const loadReports = async () => {
        try {
            setLoading(true);
            setError(null);

            if (isDemoMode) {
                // Use sample reports in demo mode
                const sampleReports: Report[] = [
                    {
                        id: 'rep-demo-1',
                        title: 'Initial Evidence Assessment',
                        caseId: caseId,
                        createdBy: 'Demo Investigator',
                        createdAt: '2024-10-01T10:00:00Z',
                        version: 1,
                    },
                    {
                        id: 'rep-demo-2',
                        title: 'Network Analysis Report',
                        caseId: caseId,
                        createdBy: 'Demo Analyst',
                        createdAt: '2024-10-02T14:30:00Z',
                        version: 2,
                    },
                ];
                setReports(sampleReports);
            } else {
                // Load reports for specific case from API
                const data = await reportsApi.list(caseId);
                setReports(data);
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            if (isDemoMode) {
                setError('Demo mode: Unable to load sample reports');
            } else {
                setError('Failed to load reports');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadPinnedItems = async () => {
        try {
            setLoadingPinned(true);
            const data = await reportItemsApi.getSections(caseId);
            setPinnedItems(data);
        } catch (error) {
            console.error('Error loading pinned items:', error);
            setPinnedItems({ sections: {}, total_items: 0 });
        } finally {
            setLoadingPinned(false);
        }
    };

    const handleDeletePinnedItem = async (itemId: string) => {
        try {
            await reportItemsApi.delete(itemId);
            success('Item removed from report');
            loadPinnedItems(); // Reload
        } catch (err) {
            console.error('Error deleting pinned item:', err);
            showError('Failed to remove item from report');
        }
    };

    useEffect(() => {
        loadReports();
        loadPinnedItems();
    }, [caseId, isDemoMode]);

    const handleGenerateReport = () => {
        // TODO: Implement report generation modal
        console.log('Generate new report for case:', caseId);
        alert('Report generation feature coming soon!');
    };

    const handleViewReport = (reportId: string) => {
        console.log('View report:', reportId);
        alert('View report feature coming soon!');
    };

    const handleDownloadReport = async (reportId: string) => {
        try {
            await reportsApi.export(reportId);
            console.log('Download report:', reportId);
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Failed to download report');
        }
    };

    const handleEditReport = (reportId: string) => {
        console.log('Edit report:', reportId);
        alert('Edit report feature coming soon!');
    };

    const handleDeleteReport = (reportId: string) => {
        if (confirm('Are you sure you want to delete this report?')) {
            console.log('Delete report:', reportId);
            alert('Delete report feature coming soon!');
        }
    };

    return (
        <div className="p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white">Report Center</h1>
                    {isDemoMode && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full">
                            DEMO MODE
                        </span>
                    )}
                </div>
                <p className="text-slate-400">
                    {isDemoMode
                        ? "Generate, view, and export sample reports for this demo case."
                        : "Generate, view, and export court-admissible reports."
                    }
                </p>
                <button 
                    onClick={handleGenerateReport}
                    className="flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-500/20"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>Generate New Report</span>
                </button>
            </div>

            {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500 rounded-md p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Report Builder - Pinned Items Section */}
            <div className="mb-8 rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-900/10 to-purple-900/10 backdrop-blur-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            Report Builder
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            {pinnedItems.total_items} item{pinnedItems.total_items !== 1 ? 's' : ''} pinned • Build your case report by pinning insights from FlowBot
                        </p>
                    </div>
                </div>

                {loadingPinned ? (
                    <div className="text-center py-8 text-slate-400">Loading pinned items...</div>
                ) : pinnedItems.total_items > 0 ? (
                    <div>
                        {/* Section Tabs */}
                        <div className="flex gap-2 mb-4 border-b border-slate-700">
                            {Object.keys(pinnedItems.sections).map((sectionName) => (
                                <button
                                    key={sectionName}
                                    onClick={() => setActiveSection(sectionName)}
                                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                                        activeSection === sectionName
                                            ? 'text-cyan-400 border-cyan-400'
                                            : 'text-slate-400 border-transparent hover:text-slate-300'
                                    }`}
                                >
                                    {sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} ({pinnedItems.sections[sectionName].length})
                                </button>
                            ))}
                        </div>

                        {/* Pinned Items */}
                        <div className="space-y-4">
                            {pinnedItems.sections[activeSection]?.map((item: any) => (
                                <div
                                    key={item.id}
                                    className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-cyan-500/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-xs rounded">
                                                    {item.item_type.replace('_', ' ').toUpperCase()}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(item.pinned_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                                        </div>
                                        <button
                                            onClick={() => handleDeletePinnedItem(item.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                            title="Remove from report"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                    
                                    <div className="text-sm text-slate-300 prose prose-sm prose-invert max-w-none">
                                        <MarkdownRenderer content={item.content.substring(0, 500)} />
                                        {item.content.length > 500 && (
                                            <span className="text-cyan-400">... (truncated)</span>
                                        )}
                                    </div>

                                    {item.evidence_ids && item.evidence_ids.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="text-xs text-slate-500">Evidence:</span>
                                            {item.evidence_ids.map((evidenceId: string) => (
                                                <span
                                                    key={evidenceId}
                                                    className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded font-mono"
                                                >
                                                    {evidenceId}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400 rounded-lg border border-dashed border-slate-600">
                        <div className="mb-3">
                            <svg className="w-16 h-16 mx-auto text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                        </div>
                        <p className="font-semibold text-lg">No items pinned yet</p>
                        <p className="text-sm mt-1">Go to **FlowBot** tab and click "Pin to Report" on AI responses to build your case report</p>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="mb-8 flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                <span className="text-sm text-slate-500 font-medium">Generated Reports</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-white">Loading reports...</div>
                </div>
            ) : reports.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/20 backdrop-blur-lg">
                    <table className="min-w-full divide-y divide-slate-700/50">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">Report Title</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Created By</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Date Created</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Version</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {reports.map((report) => (
                                <tr key={report.id} className="hover:bg-slate-800/40">
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-200 sm:pl-6">{report.title}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">{report.createdBy}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">{new Date(report.createdAt).toLocaleDateString()}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">v{report.version}.0</td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleViewReport(report.id)}
                                                className="p-1 text-gray-400 hover:text-cyan-400 rounded-md hover:bg-white/10" 
                                                title="View"
                                            >
                                                <EyeIcon className="h-5 w-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleDownloadReport(report.id)}
                                                className="p-1 text-gray-400 hover:text-green-400 rounded-md hover:bg-white/10" 
                                                title="Download PDF"
                                            >
                                                <DocumentDownloadIcon className="h-5 w-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleEditReport(report.id)}
                                                className="p-1 text-gray-400 hover:text-yellow-400 rounded-md hover:bg-white/10" 
                                                title="Edit"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteReport(report.id)}
                                                className="p-1 text-gray-400 hover:text-red-400 rounded-md hover:bg-white/10" 
                                                title="Delete"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-20 text-slate-400 rounded-lg border border-dashed border-slate-700">
                    <p className="font-semibold">No reports found.</p>
                    <p className="text-sm mt-1">Generate a new report to get started.</p>
                </div>
            )}
        </div>
    );
};

export default ReportsView;
