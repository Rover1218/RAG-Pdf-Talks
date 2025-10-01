'use client';

import { useState } from 'react';
import DocumentUploader from '@/components/DocumentUploader';
import DocumentList from '@/components/DocumentList';
import ChatInterface from '@/components/ChatInterface';
import { DocumentUploadResponse } from '@/lib/api';
import { FileText, Sparkles, Upload, FolderOpen } from 'lucide-react';

export default function Home() {
    const [selectedDocumentId, setSelectedDocumentId] = useState<string>();
    const [selectedDocumentName, setSelectedDocumentName] = useState<string>();
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleUploadSuccess = (document: DocumentUploadResponse) => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleSelectDocument = (documentId: string, documentName: string) => {
        setSelectedDocumentId(documentId);
        setSelectedDocumentName(documentName);
    };

    return (
        <main className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
            {/* Main Container */}
            <div className="max-w-[1800px] mx-auto">
                {/* Header */}
                <div className="mb-6 lg:mb-8">
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <Sparkles className="w-7 h-7 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        RAG PDF Chatbot
                                    </h1>
                                    <p className="text-sm text-gray-600 mt-1">
                                        AI-Powered Document Intelligence Platform
                                    </p>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-200">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm text-emerald-700 font-medium">Live</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Upload Section */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-blue-100 rounded-lg">
                                    <Upload className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Upload</h2>
                                    <p className="text-sm text-gray-600">Add your PDFs</p>
                                </div>
                            </div>
                            <DocumentUploader onUploadSuccess={handleUploadSuccess} />
                        </div>

                        {/* Document Library */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden h-[500px] lg:h-[550px] flex flex-col">
                            <div className="p-4 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-100 rounded-lg">
                                        <FolderOpen className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Your Library</h2>
                                        <p className="text-sm text-gray-500">Manage documents</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-1">
                                <DocumentList
                                    onSelectDocument={handleSelectDocument}
                                    selectedDocumentId={selectedDocumentId}
                                    refreshTrigger={refreshTrigger}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Chat Interface */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden h-[700px] lg:h-[900px]">
                            <ChatInterface
                                selectedDocumentId={selectedDocumentId}
                                documentName={selectedDocumentName}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8">
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                            <p className="text-sm text-gray-700">
                                Powered by <span className="text-blue-600 font-semibold">FastAPI</span>, <span className="text-blue-600 font-semibold">Next.js</span>, <span className="text-blue-600 font-semibold">Gemini AI</span> & <span className="text-blue-600 font-semibold">Pinecone</span>
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="font-medium">RAG Technology</span>
                                <span>•</span>
                                <span className="font-medium">Vector Search</span>
                                <span>•</span>
                                <span className="font-medium">AI Chat</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}