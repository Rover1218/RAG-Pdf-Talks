'use client';

import { useState, useEffect } from 'react';
import { getDocuments, deleteDocument, DocumentInfo } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { FileText, Trash2, Loader2, RefreshCw } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface DocumentListProps {
    onSelectDocument?: (documentId: string, documentName: string) => void;
    selectedDocumentId?: string;
    refreshTrigger?: number;
}

export default function DocumentList({
    onSelectDocument,
    selectedDocumentId,
    refreshTrigger
}: DocumentListProps) {
    const [documents, setDocuments] = useState<DocumentInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<{ id: string, name: string } | null>(null);

    const loadDocuments = async () => {
        setIsLoading(true);
        try {
            const docs = await getDocuments();
            // Ensure docs is an array
            setDocuments(Array.isArray(docs) ? docs : []);
        } catch (error) {
            console.error('Error loading documents:', error);
            setDocuments([]); // Set empty array on error
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, [refreshTrigger]);

    const handleDeleteClick = (documentId: string, documentName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDocumentToDelete({ id: documentId, name: documentName });
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!documentToDelete) return;

        setDeletingId(documentToDelete.id);
        try {
            await deleteDocument(documentToDelete.id);
            setDocuments(docs => docs.filter(doc => doc.document_id !== documentToDelete.id));
            setDocumentToDelete(null);
        } catch (error) {
            console.error('Error deleting document:', error);
        } finally {
            setDeletingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                <p className="text-sm text-gray-600">Loading documents...</p>
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="text-center p-8 text-gray-500">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-lg bg-gray-50 border border-gray-200 mb-4">
                    <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <p className="font-medium text-gray-900 text-lg mb-2">No documents uploaded yet</p>
                <p className="text-sm mt-1 text-gray-500">Upload a PDF document to get started</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-base">
                    <span>My Documents</span>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                        {documents.length}
                    </span>
                </h3>
                <button
                    onClick={loadDocuments}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-all hover:shadow-sm active:scale-95 border border-gray-200"
                    title="Refresh"
                >
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                </button>
            </div>

            {documents.map((doc, index) => (
                <div
                    key={doc.document_id}
                    onClick={() => onSelectDocument?.(doc.document_id, doc.filename)}
                    className={`
                        group p-4 rounded-lg border cursor-pointer transition-all animate-fade-in mb-3
                        ${selectedDocumentId === doc.document_id
                            ? 'border-blue-300 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-200 bg-white hover:bg-blue-50/30 hover:shadow-sm'
                        }
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`p-3 rounded-lg transition-all shrink-0 ${selectedDocumentId === doc.document_id
                                ? 'bg-blue-100 border border-blue-200'
                                : 'bg-gray-50 border border-gray-200 group-hover:bg-blue-50 group-hover:border-blue-200'
                                }`}>
                                <FileText className={`w-6 h-6 transition-colors ${selectedDocumentId === doc.document_id ? 'text-blue-600' : 'text-gray-600'
                                    }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-base text-gray-900 truncate group-hover:text-blue-700 transition-colors mb-2">
                                    {doc.filename}
                                </p>
                                <div className="flex items-center flex-wrap gap-2">
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${doc.status === 'processed'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}>
                                        {doc.status}
                                    </span>
                                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded-full border border-gray-200">
                                        {doc.chunks_count} chunks
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {formatDate(doc.upload_date)}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={(e) => handleDeleteClick(doc.document_id, doc.filename, e)}
                            disabled={deletingId === doc.document_id}
                            className="p-2.5 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 shrink-0 border border-transparent hover:border-red-200"
                            title="Delete document"
                        >
                            {deletingId === doc.document_id ? (
                                <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
                            ) : (
                                <Trash2 className="w-5 h-5 text-red-500" />
                            )}
                        </button>
                    </div>
                </div>
            ))}

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.4s ease-out forwards;
                    opacity: 0;
                }
            `}</style>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setDocumentToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Document"
                message={`Are you sure you want to delete "${documentToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
}
