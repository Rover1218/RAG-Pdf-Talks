'use client';

import { useState, useEffect } from 'react';
import { getDocuments, deleteDocument, DocumentInfo } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { FileText, Trash2, Loader2, RefreshCw } from 'lucide-react';

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

    const handleDelete = async (documentId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this document?')) {
            return;
        }

        setDeletingId(documentId);
        try {
            await deleteDocument(documentId);
            setDocuments(docs => docs.filter(doc => doc.document_id !== documentId));
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('Failed to delete document');
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-3">
                    <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-medium text-gray-700">No documents uploaded yet</p>
                <p className="text-sm mt-1 text-gray-500">Upload a PDF to get started</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <span>My Documents</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        {documents.length}
                    </span>
                </h3>
                <button
                    onClick={loadDocuments}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-all hover:shadow-sm active:scale-95"
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
                        group p-3.5 rounded-xl border cursor-pointer transition-all animate-fade-in
                        ${selectedDocumentId === doc.document_id
                            ? 'border-blue-400 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 shadow-lg shadow-blue-100/50'
                            : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-gradient-to-br hover:from-blue-50/30 hover:to-indigo-50/30 hover:shadow-md'
                        }
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`p-2.5 rounded-lg transition-all shrink-0 ${selectedDocumentId === doc.document_id
                                ? 'bg-blue-100 ring-2 ring-blue-200'
                                : 'bg-gray-100 group-hover:bg-blue-50'
                                }`}>
                                <FileText className={`w-5 h-5 transition-colors ${selectedDocumentId === doc.document_id ? 'text-blue-600' : 'text-gray-600'
                                    }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                    {doc.filename}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${doc.status === 'processed'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {doc.status}
                                    </span>
                                    <span className="text-[10px] text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded">
                                        {doc.chunks_count} chunks
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                    {formatDate(doc.upload_date)}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={(e) => handleDelete(doc.document_id, e)}
                            disabled={deletingId === doc.document_id}
                            className="p-2 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 shrink-0"
                            title="Delete document"
                        >
                            {deletingId === doc.document_id ? (
                                <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4 text-red-500" />
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
        </div>
    );
}
