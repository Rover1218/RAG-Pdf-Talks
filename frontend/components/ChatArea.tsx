'use client';

import React, { useState, useRef, useEffect } from 'react';
import ChatInput from './ChatInput';
import { sendChatMessage, ChatMessage, ChatResponse } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { formatAIMessage } from '@/lib/formatMarkdown';

interface ChatAreaProps {
    selectedDocumentIds?: string[];
    documentNames?: string[];
}

const ChatArea: React.FC<ChatAreaProps> = ({ selectedDocumentIds = [], documentNames = [] }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string>();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Clear messages when document changes
        setMessages([]);
        setConversationId(undefined);
    }, [selectedDocumentIds]);

    const handleSend = async (content: string) => {
        if (!content.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: content,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response: ChatResponse = await sendChatMessage({
                message: content,
                document_ids: selectedDocumentIds,
                conversation_id: conversationId,
            });

            setConversationId(response.conversation_id);

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.response,
                timestamp: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error processing your message. Please try again.',
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderWelcomeState = () => (
        <div className="welcome-state">
            <div className="welcome-content">
                <div className="welcome-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </div>
                <h2>👋 Welcome!</h2>
                <p>
                    {selectedDocumentIds.length > 0
                        ? `Ready to talk about ${documentNames.length > 2
                            ? `${documentNames.length} documents`
                            : `"${documentNames.join(' & ')}"`}. What would you like to know?`
                        : "Upload a document and ask me anything about it."}
                </p>

                <div className="quick-actions">
                    <button className="secondary-button" onClick={() => handleSend("Summarize this document")}>Summarize content</button>
                    <button className="secondary-button" onClick={() => handleSend("What are the key takeaways?")}>Extract key points</button>
                    <button className="secondary-button" onClick={() => handleSend("What's the main topic?")}>Main topic</button>
                </div>
            </div>

            <style jsx>{`
        .welcome-state {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
        }

        .welcome-content {
          max-width: 600px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .welcome-icon {
          width: 80px;
          height: 80px;
          background: var(--color-accent-soft);
          color: var(--color-accent-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        h2 { color: var(--color-text-primary); }
        p { color: var(--color-text-secondary); font-size: 15px; }

        .quick-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          flex-wrap: wrap;
          justify-content: center;
        }
      `}</style>
        </div>
    );

    const renderActiveChat = () => (
        <div className="chat-messages">
            {messages.map((msg, i) => (
                <div key={i} className={`message-row ${msg.role}`}>
                    {msg.role === 'assistant' && <div className="avatar-small">AI</div>}
                    <div className="message-stack">
                        {msg.role === 'assistant' ? (
                            <div
                                className="message-content ai-bubble"
                                dangerouslySetInnerHTML={{ __html: formatAIMessage(msg.content) }}
                            />
                        ) : (
                            <div className="message-content user-bubble">
                                {msg.content}
                            </div>
                        )}
                        <div className="timestamp">{msg.timestamp ? formatDate(msg.timestamp) : ''}</div>
                    </div>
                </div>
            ))}

            {isLoading && (
                <div className="message-row assistant">
                    <div className="avatar-small AI pulse">AI</div>
                    <div className="message-stack">
                        <div className="message-content ai-bubble loading-bubble">
                            <div className="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />

            <style jsx global>{`
        .md-bold { color: var(--color-accent-fg); font-weight: 600; }
        .md-li { display: flex; gap: 8px; margin: 4px 0; align-items: flex-start; }
        .md-bullet, .md-num { color: var(--color-accent-fg); font-weight: 700; flex-shrink: 0; }
        .md-li-text { flex: 1; }
        .md-spacer { height: 12px; }
      `}</style>

            <style jsx>{`
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 32px 40px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .message-row {
          display: flex;
          max-width: 85%;
          animation: fadeInUp 300ms ease-out forwards;
        }

        .message-row.user {
          align-self: flex-end;
          flex-direction: column;
          align-items: flex-end;
        }

        .message-row.assistant {
          align-self: flex-start;
          gap: 12px;
        }

        .message-content {
          padding: 12px 20px;
          font-size: 15px;
          line-height: 1.5;
        }

        .user-bubble {
          background: var(--color-accent-primary);
          color: white;
          border-radius: 16px 16px 4px 16px;
          box-shadow: 0 4px 12px rgba(74, 127, 255, 0.2);
        }

        .ai-bubble {
          background: var(--color-bg-surface);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border);
          border-radius: 16px 16px 16px 4px;
          box-shadow: var(--shadow-card);
        }

        .loading-bubble { padding: 16px 24px; }

        .avatar-small {
          width: 32px;
          height: 32px;
          background: var(--color-accent-soft);
          color: var(--color-accent-fg);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
          border: 1px solid var(--color-border);
        }

        .message-stack { display: flex; flex-direction: column; gap: 4px; }
        .timestamp { font-size: 11px; color: var(--color-text-tertiary); margin-top: 4px; }

        .typing-indicator { display: flex; gap: 4px; }
        .typing-indicator span {
            width: 6px; height: 6px; background: var(--color-text-tertiary);
            border-radius: 50%; animation: bounce 1s infinite;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 200ms; }
        .typing-indicator span:nth-child(3) { animation-delay: 400ms; }

        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
        .pulse { animation: pulse 1.5s infinite; }
      `}</style>
        </div>
    );

    return (
        <main className="chat-area">
            <div className="chat-container">
                {messages.length === 0 ? renderWelcomeState() : renderActiveChat()}
            </div>
            <ChatInput
                onSend={handleSend}
                isLoading={isLoading}
                disabled={isLoading}
            />

            <style jsx>{`
        .chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--color-bg-primary);
          height: calc(100vh - var(--header-height));
          position: relative;
        }

        .chat-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
      `}</style>
        </main>
    );
};

export default ChatArea;
