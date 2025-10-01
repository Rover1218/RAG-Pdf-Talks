'use client';

import { useState, useRef } from 'react';
import { uploadDocument, DocumentUploadResponse } from '@/lib/api';
import { Upload, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface DocumentUploaderProps {
    onUploadSuccess?: (document: DocumentUploadResponse) => void;
}

export default function DocumentUploader({ onUploadSuccess }: DocumentUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [uploadMessage, setUploadMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            await handleFileUpload(files[0]);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            await handleFileUpload(files[0]);
        }
    };

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
            setUploadMessage(`Successfully uploaded ${response.filename} (${response.chunks_count} chunks)`);

            if (onUploadSuccess) {
                onUploadSuccess(response);
            }

            // Reset after 3 seconds
            setTimeout(() => {
                setUploadStatus('idle');
                setUploadMessage('');
            }, 3000);
        } catch (error) {
            setUploadStatus('error');
            setUploadMessage(error instanceof Error ? error.message : 'Failed to upload document');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="w-full">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-300 transform
          ${isDragging
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 scale-105 shadow-lg'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50 hover:shadow-md'
                    }
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                />

                <div className="flex flex-col items-center gap-3">
                    {isUploading ? (
                        <>
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500 rounded-full blur opacity-50 animate-pulse"></div>
                                <Loader2 className="relative w-12 h-12 text-blue-600 animate-spin" />
                            </div>
                            <p className="text-lg font-semibold text-gray-800">Uploading and processing...</p>
                            <p className="text-sm text-gray-600">This may take a few moments</p>
                            <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 animate-progress"></div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={`p-4 rounded-xl transition-all ${isDragging ? 'bg-blue-100' : 'bg-gradient-to-br from-blue-50 to-indigo-50'
                                }`}>
                                <Upload className={`w-10 h-10 transition-colors ${isDragging ? 'text-blue-600' : 'text-gray-500'
                                    }`} />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-gray-800">
                                    {isDragging ? '📄 Drop your PDF here!' : 'Drop your PDF here or click to browse'}
                                </p>
                                <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-2">
                                    <File className="w-3.5 h-3.5" />
                                    PDF files only, max 10MB
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Status Messages */}
            {uploadStatus !== 'idle' && uploadMessage && (
                <div
                    className={`mt-4 p-4 rounded-xl flex items-start gap-3 shadow-md border animate-slide-down ${uploadStatus === 'success'
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200'
                            : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-200'
                        }`}
                >
                    {uploadStatus === 'success' ? (
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 animate-bounce-once" />
                    ) : (
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm font-medium">{uploadMessage}</p>
                </div>
            )}

            <style jsx>{`
                @keyframes progress {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(400%);
                    }
                }
                @keyframes slide-down {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes bounce-once {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }
                .animate-progress {
                    animation: progress 1.5s ease-in-out infinite;
                }
                .animate-slide-down {
                    animation: slide-down 0.3s ease-out;
                }
                .animate-bounce-once {
                    animation: bounce-once 0.5s ease-out;
                }
            `}</style>
        </div>
    );
}
