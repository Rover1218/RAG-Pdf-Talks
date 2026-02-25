'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';

export default function Home() {
    const [selectedDocs, setSelectedDocs] = useState<Map<string, string>>(new Map());
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleToggleDocument = (documentId: string, documentName: string) => {
        setSelectedDocs(prev => {
            const next = new Map(prev);
            if (next.has(documentId)) {
                next.delete(documentId);
            } else {
                next.set(documentId, documentName);
            }
            return next;
        });
    };

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="app-container">
            <Header />
            <div className="main-layout">
                <Sidebar
                    onSelectDocument={handleToggleDocument}
                    selectedDocumentIds={Array.from(selectedDocs.keys())}
                    refreshTrigger={refreshTrigger}
                    onRefresh={handleRefresh}
                />
                <ChatArea
                    selectedDocumentIds={Array.from(selectedDocs.keys())}
                    documentNames={Array.from(selectedDocs.values())}
                />
            </div>

            <style jsx>{`
                .app-container {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    background: var(--color-bg-primary);
                }

                .main-layout {
                    display: flex;
                    flex: 1;
                    max-width: 100vw;
                    overflow: hidden;
                }

                @media (max-width: 1024px) {
                    .main-layout {
                        flex-direction: column;
                        overflow-y: auto;
                    }
                }
            `}</style>
        </div>
    );
}