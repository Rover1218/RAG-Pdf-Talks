'use client';

import React, { useState, useRef } from 'react';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    isLoading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, isLoading }) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        if (!input.trim() || disabled || isLoading) return;
        onSend(input);
        setInput('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-input-container">
            <div className="input-wrapper">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me anything about your document..."
                    rows={1}
                    disabled={disabled}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                    }}
                />
                <button
                    className="send-button"
                    aria-label="Send message"
                    onClick={handleSend}
                    disabled={disabled || isLoading || !input.trim()}
                >
                    {isLoading ? (
                        <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    )}
                </button>
            </div>
            <p className="input-hint">Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line</p>

            <style jsx>{`
        .chat-input-container {
          position: sticky;
          bottom: 0;
          width: 100%;
          background: var(--color-bg-surface);
          border-top: 1px solid var(--color-border);
          padding: 24px 32px 16px;
          z-index: 10;
        }

        .input-wrapper {
          position: relative;
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          align-items: flex-end;
          gap: 12px;
          background: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 8px 12px;
          box-shadow: var(--shadow-card);
          transition: border-color 200ms ease;
        }

        .input-wrapper:focus-within {
          border-color: var(--color-accent-primary);
          box-shadow: var(--shadow-card), 0 0 0 3px var(--color-accent-ring);
        }

        textarea {
          flex: 1;
          border: none;
          outline: none;
          resize: none;
          padding: 8px 4px;
          max-height: 200px;
          background: transparent;
          color: var(--color-text-primary);
          line-height: 1.5;
        }

        textarea:disabled {
            opacity: 0.6;
        }

        textarea::placeholder {
          color: var(--color-text-tertiary);
        }

        .send-button {
          width: 36px;
          height: 36px;
          background: var(--color-accent-primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 200ms ease;
          flex-shrink: 0;
          margin-bottom: 2px;
        }

        .send-button svg {
            transform: translate(-1px, 1px);
        }

        .send-button:disabled {
            background: var(--color-text-tertiary);
            cursor: not-allowed;
        }

        .send-button:not(:disabled):hover {
          background: var(--color-accent-hover);
          transform: scale(1.05);
        }

        .input-hint {
          max-width: 900px;
          margin: 8px auto 0;
          font-size: 12px;
          color: var(--color-text-tertiary);
          text-align: center;
        }

        .animate-spin {
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default ChatInput;
