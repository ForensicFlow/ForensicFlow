import React, { useState, useEffect, useRef } from 'react';
import { casesApi } from '@/lib/api.ts';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  onUploadComplete: () => void;
}

interface FileUploadStatus {
  file: File;
  id?: number;
  status: 'pending' | 'uploading' | 'uploaded' | 'queued' | 'validating' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  message?: string;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  caseId,
  onUploadComplete,
}) => {
  const [files, setFiles] = useState<FileUploadStatus[]>([]);
  const [fileType, setFileType] = useState<string>('UFDR');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Esc key to close modal
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !uploading) {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, uploading]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Poll for file processing status
  const pollFileStatus = async (fileIds: number[]) => {
    try {
      const response = await casesApi.getFileStatus(caseId);
      const statusData = response.files || [];
      
      setFiles(prevFiles => prevFiles.map(file => {
        if (!file.id) return file;
        
        const statusInfo = statusData.find((s: any) => s.id === file.id);
        if (!statusInfo) return file;
        
        let status: FileUploadStatus['status'] = 'processing';
        if (statusInfo.processed && statusInfo.processing_status === 'completed') {
          status = 'completed';
        } else if (statusInfo.processing_status?.startsWith('failed')) {
          status = 'failed';
        } else if (statusInfo.processing_status === 'queued') {
          status = 'queued';
        } else if (statusInfo.processing_status === 'validating') {
          status = 'validating';
        } else if (statusInfo.processing_status === 'processing') {
          status = 'processing';
        } else if (statusInfo.processing_status === 'uploaded') {
          status = 'uploaded';
        }
        
        return {
          ...file,
          status,
          error: status === 'failed' ? statusInfo.processing_status : undefined,
        };
      }));
      
      // Check if all files are done processing (or queued without Celery)
      const allComplete = fileIds.every(id => {
        const statusInfo = statusData.find((s: any) => s.id === id);
        return statusInfo && (
          (statusInfo.processed && statusInfo.processing_status === 'completed') ||
          statusInfo.processing_status?.startsWith('failed') ||
          statusInfo.processing_status === 'queued'  // Stop polling for queued files (no Celery)
        );
      });
      
      if (allComplete && pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        setUploadComplete(true);
      }
    } catch (err) {
      console.error('Error polling file status:', err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map(file => ({
        file,
        status: 'pending' as const,
        progress: 0,
      }));
      setFiles(prev => [...prev, ...newFiles]);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        status: 'pending' as const,
        progress: 0,
      }));
      setFiles(prev => [...prev, ...newFiles]);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadComplete(false);

    try {
      // Update all files to uploading status
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const, progress: 50 })));

      // Upload all files at once
      const filesToUpload = files.map(f => f.file);
      const response = await casesApi.uploadFiles(caseId, filesToUpload, fileType);

      // Update files with IDs and uploaded status
      setFiles(prev => prev.map((file, index) => {
        const uploadedFile = response.uploaded_files.find(
          (uf: any) => uf.filename === file.file.name
        );
        
        return {
          ...file,
          id: uploadedFile?.id,
          status: 'uploaded' as const,
          progress: 100,
          message: uploadedFile?.message,
        };
      }));

      // Handle errors
      if (response.errors && response.errors.length > 0) {
        const errorMessages = response.errors.map(e => `${e.filename}: ${e.error}`).join(', ');
        setError(`Some files failed: ${errorMessages}`);
      }

      // Start polling for processing status
      const uploadedFileIds = response.uploaded_files.map((f: any) => f.id);
      if (uploadedFileIds.length > 0) {
        // Poll every 2 seconds
        pollingIntervalRef.current = setInterval(() => {
          pollFileStatus(uploadedFileIds);
        }, 2000);
        
        // Do initial poll immediately
        pollFileStatus(uploadedFileIds);
      }

      // Call onUploadComplete to refresh case data
      onUploadComplete();
      
    } catch (err: any) {
      setError(err.message || 'Failed to upload files');
      setFiles(prev => prev.map(f => ({ 
        ...f, 
        status: 'failed' as const, 
        error: err.message 
      })));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // Reset state
    setFiles([]);
    setError(null);
    setUploadComplete(false);
    onClose();
  };

  if (!isOpen) return null;

  const getStatusColor = (status: FileUploadStatus['status']) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'processing': return 'text-yellow-400';
      case 'validating': return 'text-yellow-400';
      case 'uploading': return 'text-blue-400';
      case 'uploaded': return 'text-cyan-400';
      case 'queued': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: FileUploadStatus['status']) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'processing':
      case 'validating':
      case 'uploading':
        return (
          <svg className="h-5 w-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'queued':
        return (
          <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl border border-slate-700 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">
            Upload Files {files.length > 0 && `(${files.length})`}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={uploading}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* File Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              File Type
            </label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              disabled={uploading}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
            >
              <option value="UFDR">UFDR Report</option>
              <option value="JSON">JSON</option>
              <option value="XML">XML</option>
              <option value="CSV">CSV</option>
              <option value="PDF">PDF Document</option>
              <option value="Image">Image</option>
            </select>
          </div>

          {/* File Drop Zone */}
          {files.length === 0 && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <div className="space-y-2">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-300">Drag and drop files here</p>
                <p className="text-sm text-gray-400">or</p>
                <label className="inline-block">
                  <span className="px-4 py-2 bg-cyan-600 text-white rounded-md cursor-pointer hover:bg-cyan-500 transition-colors">
                    Browse Files
                  </span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".json,.xml,.csv,.pdf,.jpg,.jpeg,.png,.ufdr"
                  />
                </label>
              </div>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-300">Selected Files</h4>
                {!uploading && (
                  <label className="text-sm text-cyan-400 hover:text-cyan-300 cursor-pointer">
                    + Add More
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".json,.xml,.csv,.pdf,.jpg,.jpeg,.png,.ufdr"
                    />
                  </label>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((fileStatus, index) => (
                  <div
                    key={index}
                    className="bg-slate-700/50 rounded-lg p-3 border border-slate-600"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(fileStatus.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {fileStatus.file.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{(fileStatus.file.size / 1024 / 1024).toFixed(2)} MB</span>
                          <span>•</span>
                          <span className={getStatusColor(fileStatus.status)}>
                            {fileStatus.status}
                          </span>
                        </div>
                        {fileStatus.error && (
                          <p className="text-xs text-red-400 mt-1">{fileStatus.error}</p>
                        )}
                      </div>
                      {fileStatus.status === 'pending' && !uploading && (
                        <button
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-md p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {uploadComplete && (
            <div className="bg-green-500/10 border border-green-500 rounded-md p-3">
              <p className="text-green-400 text-sm">
                All files processed successfully! You can close this dialog.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 mt-4 border-t border-slate-700">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors disabled:opacity-50"
            disabled={uploading}
          >
            {uploadComplete ? 'Close' : 'Cancel'}
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;

