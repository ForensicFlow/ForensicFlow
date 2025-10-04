import React, { useState, useEffect } from 'react';
import { casesApi } from '../lib/api';
import { XIcon } from './icons';

interface CreateCaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCaseCreated: () => void;
}

const CreateCaseModal: React.FC<CreateCaseModalProps> = ({ isOpen, onClose, onCaseCreated }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'Active' as 'Active' | 'Closed' | 'Archived',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Handle Esc key to close modal
    useEffect(() => {
        if (!isOpen) return;
        
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !loading) {
                handleClose();
            }
        };
        
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, loading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            setError('Case name is required');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            // Let the backend generate ID and case number for better reliability
            await casesApi.create({
                name: formData.name,
                description: formData.description,
                status: formData.status,
            });

            // Reset form
            setFormData({
                name: '',
                description: '',
                status: 'Active',
            });

            // Notify parent and close
            onCaseCreated();
            onClose();
        } catch (err: any) {
            console.error('Error creating case:', err);
            const errorMessage = err.message || 'Failed to create case. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({
                name: '',
                description: '',
                status: 'Active',
            });
            setError(null);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-slate-900 rounded-xl shadow-2xl border border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Create New Case</h2>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        <XIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Case Name */}
                    <div>
                        <label htmlFor="caseName" className="block text-sm font-medium text-slate-300 mb-2">
                            Case Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            id="caseName"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Operation Phoenix"
                            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="caseDescription" className="block text-sm font-medium text-slate-300 mb-2">
                            Description
                        </label>
                        <textarea
                            id="caseDescription"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of the case..."
                            rows={4}
                            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                            disabled={loading}
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label htmlFor="caseStatus" className="block text-sm font-medium text-slate-300 mb-2">
                            Status
                        </label>
                        <select
                            id="caseStatus"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Closed' | 'Archived' })}
                            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            disabled={loading}
                        >
                            <option value="Active">Active</option>
                            <option value="Closed">Closed</option>
                            <option value="Archived">Archived</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Case'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCaseModal;


