'use client';

import React, { useState, useRef, useEffect } from 'react';
import { uploadDocument, getDocuments, deleteDocument, DocumentInfo } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import ConfirmModal from './ConfirmModal';

interface SidebarProps {
    onSelectDocument: (documentId: string, documentName: string) => void;
    selectedDocumentIds: string[];
    refreshTrigger: number;
    onRefresh: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    onSelectDocument,
    selectedDocumentIds,
    refreshTrigger,
    onRefresh
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [uploadMessage, setUploadMessage] = useState('');

    const [documents, setDocuments] = useState<DocumentInfo[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<{ id: string, name: string } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadDocuments = async () => {
        setIsLoadingDocs(true);
        try {
            const docs = await getDocuments();
            setDocuments(Array.isArray(docs) ? docs : []);
        } catch (error) {
            console.error('Error loading documents:', error);
            setDocuments([]);
        } finally {
            setIsLoadingDocs(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, [refreshTrigger]);

    const handleFileUpload = async (file: File) => {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setUploadStatus('error');
            setUploadMessage('Please upload a PDF file');
            return;
        }

        setIsUploading(true);
        setUploadStatus('idle');
        setUploadMessage('');

        try {
            const response = await uploadDocument(file);
            setUploadStatus('success');
            setUploadMessage(`Successfully uploaded ${response.filename}`);

            // Auto-select the newly uploaded document
            onSelectDocument(response.document_id, response.filename);

            onRefresh(); // Refresh the list

            setTimeout(() => {
                setUploadStatus('idle');
                setUploadMessage('');
            }, 3000);
        } catch (error) {
            setUploadStatus('error');
            setUploadMessage(error instanceof Error ? error.message : 'Failed to upload document');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteClick = (docId: string, docName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDocumentToDelete({ id: docId, name: docName });
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!documentToDelete) return;
        setDeletingId(documentToDelete.id);
        try {
            await deleteDocument(documentToDelete.id);
            setDocuments(docs => docs.filter(doc => doc.document_id !== documentToDelete.id));
            if (selectedDocumentIds.includes(documentToDelete.id)) {
                onSelectDocument(documentToDelete.id, documentToDelete.name);
            }
        } catch (error) {
            console.error('Error deleting document:', error);
        } finally {
            setDeletingId(null);
            setDeleteModalOpen(false);
            setDocumentToDelete(null);
        }
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                {/* Upload Section Card */}
                <div className="card upload-card">
                    <div className="section-header">
                        <div className="icon-container">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <div className="text-container">
                            <h3>Upload</h3>
                            <p className="subtitle">Add your PDFs</p>
                        </div>
                    </div>

                    <div
                        className={`upload-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            const files = e.dataTransfer.files;
                            if (files.length > 0) handleFileUpload(files[0]);
                        }}
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                    >
                        {isUploading ? (
                            <div className="progress-container">
                                <p className="uploading-text">Processing...</p>
                                <div className="progress-bar-wrapper">
                                    <div className="progress-bar-line"></div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="upload-icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                </div>
                                <p className="upload-text">Drop your PDF here or click to browse</p>
                                <p className="upload-subtext">PDF files only, max 10MB</p>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            className="hidden-input"
                            onChange={(e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) handleFileUpload(files[0]);
                            }}
                        />
                    </div>

                    {uploadStatus !== 'idle' && (
                        <div className={`status-message ${uploadStatus}`}>
                            {uploadStatus === 'success' ? '✓ ' : '✕ '} {uploadMessage}
                        </div>
                    )}
                </div>

                {/* Library Section Card */}
                <div className="card library-card">
                    <div className="section-header">
                        <div className="icon-container">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <div className="text-container">
                            <h3>Your Library</h3>
                            <p className="subtitle">Manage documents</p>
                        </div>
                        <button className="refresh-btn" onClick={loadDocuments} disabled={isLoadingDocs}>
                            <svg className={isLoadingDocs ? 'animate-spin' : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                                <path d="M21 3v5h-5" />
                                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                                <path d="M3 21v-5h5" />
                            </svg>
                        </button>
                    </div>

                    <div className="doc-list">
                        {isLoadingDocs ? (
                            <div className="loading-state">Loading documents...</div>
                        ) : documents.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                                        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                                    </svg>
                                </div>
                                <p className="empty-text">No documents uploaded yet</p>
                                <p className="empty-subtext">Upload a PDF document to get started</p>
                            </div>
                        ) : (
                            documents.map(doc => (
                                <div
                                    key={doc.document_id}
                                    className={`doc-item ${selectedDocumentIds.includes(doc.document_id) ? 'active' : ''}`}
                                    onClick={() => onSelectDocument(doc.document_id, doc.filename)}
                                >
                                    <div className="doc-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                                            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                                        </svg>
                                    </div>
                                    <div className="doc-info">
                                        <p className="doc-name">{doc.filename}</p>
                                        <p className="doc-meta">{doc.chunks_count} chunks • {formatDate(doc.upload_date)}</p>
                                    </div>
                                    <button
                                        className="delete-btn"
                                        onClick={(e) => handleDeleteClick(doc.document_id, doc.filename, e)}
                                        disabled={deletingId === doc.document_id}
                                    >
                                        {deletingId === doc.document_id ? (
                                            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                            </svg>
                                        ) : (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18" />
                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Document"
                message={`Are you sure you want to delete "${documentToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />

            <style jsx>{`
        .sidebar {
          width: var(--sidebar-width);
          min-width: var(--sidebar-width);
          background: var(--color-bg-surface);
          border-right: 1px solid var(--color-border);
          padding: 24px;
          height: calc(100vh - var(--header-height));
          overflow-y: auto;
          position: sticky;
          top: var(--header-height);
        }

        .sidebar-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          position: relative;
        }

        .refresh-btn {
            position: absolute;
            right: 0;
            background: transparent;
            color: var(--color-text-tertiary);
            padding: 4px;
            border-radius: 4px;
        }

        .refresh-btn:hover {
            color: var(--color-accent-fg);
            background: var(--color-accent-soft);
        }

        .icon-container {
          width: 40px;
          height: 40px;
          background: var(--color-accent-soft);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-accent-fg);
        }

        .text-container h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .subtitle {
          font-size: 13px;
          color: var(--color-text-secondary);
        }

        /* Upload Zone */
        .upload-zone {
          border: 2px dashed var(--color-upload-border);
          background: var(--color-upload-bg);
          border-radius: 12px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 200ms ease;
          position: relative;
        }

        .upload-zone:hover, .upload-zone.dragging {
          border-color: var(--color-accent-primary);
          background: var(--color-upload-bg-hover);
        }

        .upload-zone.uploading {
            pointer-events: none;
            opacity: 0.7;
        }

        .upload-icon {
          color: var(--color-text-tertiary);
          margin-bottom: 16px;
          display: flex;
          justify-content: center;
        }

        .upload-text {
          font-size: 15px;
          font-weight: 500;
          color: var(--color-text-primary);
          margin-bottom: 8px;
        }

        .upload-subtext {
          font-size: 13px;
          color: var(--color-text-tertiary);
        }

        .hidden-input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .status-message {
            margin-top: 12px;
            font-size: 13px;
            padding: 8px 12px;
            border-radius: 8px;
            text-align: center;
        }

        .status-message.success { background: var(--color-success-bg); color: var(--color-success); }
        .status-message.error { background: var(--color-danger-bg); color: var(--color-danger); }

        .progress-container {
            width: 100%;
            padding: 0 12px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .uploading-text { 
            font-size: 15px;
            font-weight: 600; 
            color: var(--color-accent-fg);
        }

        .progress-bar-wrapper {
            width: 100%;
            height: 6px;
            background: var(--color-bg-subtle);
            border-radius: 10px;
            overflow: hidden;
            position: relative;
        }

        .progress-bar-line {
            position: absolute;
            height: 100%;
            width: 30%;
            background: var(--color-accent-primary);
            border-radius: 10px;
            animation: progress-slide 1.5s infinite ease-in-out;
        }

        @keyframes progress-slide {
            0% { left: -30%; }
            50% { left: 40%; width: 40%; }
            100% { left: 100%; }
        }

        /* Document List */
        .doc-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .doc-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-radius: 12px;
            border: 1px solid var(--color-border);
            cursor: pointer;
            transition: all 200ms ease;
            position: relative;
        }

        .doc-item:hover {
            border-color: var(--color-accent-primary);
            background: var(--color-bg-primary);
        }

        .doc-item.active {
            border-color: var(--color-accent-primary);
            background: var(--color-accent-soft);
            box-shadow: var(--shadow-card);
        }

        .doc-icon {
            width: 36px;
            height: 36px;
            background: var(--color-accent-soft);
            color: var(--color-text-secondary);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .active .doc-icon {
            color: var(--color-accent-fg);
            background: var(--color-bg-surface);
        }

        .doc-info {
            flex: 1;
            min-width: 0;
        }

        .doc-name {
            font-size: 14px;
            font-weight: 600;
            color: var(--color-text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .doc-meta {
            font-size: 12px;
            color: var(--color-text-tertiary);
        }

        .delete-btn {
            background: transparent;
            color: var(--color-text-tertiary);
            padding: 6px;
            border-radius: 6px;
            display: flex;
            opacity: 0;
            transition: opacity 200ms ease;
        }

        .doc-item:hover .delete-btn { opacity: 1; }

        .delete-btn:hover {
            color: var(--color-danger);
            background: var(--color-danger-bg);
        }

        .animate-spin {
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        /* Empty State */
        .empty-state { text-align: center; padding: 20px; }
        .empty-icon { color: var(--color-text-tertiary); margin-bottom: 12px; display: flex; justify-content: center; }
        .empty-text { font-size: 14px; font-weight: 600; color: var(--color-text-secondary); }
        .empty-subtext { font-size: 12px; color: var(--color-text-tertiary); }
        .loading-state { text-align: center; padding: 20px; font-size: 14px; color: var(--color-text-tertiary); }

        @media (max-width: 1024px) {
          .sidebar {
            width: 100%;
            height: auto;
            position: relative;
            top: 0;
            border-right: none;
            border-bottom: 1px solid var(--color-border);
          }
        }
      `}</style>
        </aside>
    );
};

export default Sidebar;
