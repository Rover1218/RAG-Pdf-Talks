'use client';

import { useState, useRef, useEffect } from 'react';
import { sendChatMessage, ChatMessage, ChatResponse } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Send, Loader2, FileText } from 'lucide-react';

interface ChatInterfaceProps {
    selectedDocumentId?: string;
    documentName?: string;
}

export default function ChatInterface({ selectedDocumentId, documentName }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
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
    }, [selectedDocumentId]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: input,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            console.log('🚀 Sending chat message:', {
                message: input,
                document_id: selectedDocumentId,
                document_name: documentName,
                conversation_id: conversationId
            });

            const response: ChatResponse = await sendChatMessage({
                message: input,
                document_id: selectedDocumentId,
                conversation_id: conversationId,
            });

            console.log('✅ Received response:', response);

            setConversationId(response.conversation_id);

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.response,
                timestamp: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error processing your message. Please try again.',
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="relative p-6 border-b border-gray-200 bg-gray-50 overflow-hidden">
                <div className="relative">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                            <Send className="w-5 h-5 text-blue-600" />
                        </div>
                        AI Chat Assistant
                    </h2>
                    {documentName ? (
                        <div className="flex items-center mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 w-fit gap-2 animate-fade-in">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <FileText className="w-4 h-4" />
                            <span className="font-medium">Active: {documentName}</span>
                        </div>
                    ) : (
                        <div className="flex items-center mt-3 text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 w-fit gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="font-medium">No document selected - Select one to start</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 border border-blue-100 mb-4">
                            <Send className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-xl font-semibold mb-2 text-gray-800">👋 Welcome!</p>
                        <p className="text-gray-600">Upload a document and ask me anything about it.</p>
                        <div className="mt-6 flex flex-wrap justify-center gap-2">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-sm">Summarize content</span>
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-sm">Extract key points</span>
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-sm">Answer questions</span>
                        </div>
                    </div>
                )}

                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                        <div
                            className={`max-w-[85%] rounded-xl px-5 py-4 shadow-sm transform transition-all hover:scale-[1.01] ${message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-800 border border-gray-200'
                                }`}
                        >
                            {message.role === 'assistant' ? (
                                <div className="prose prose-sm max-w-none">
                                    <div
                                        className="whitespace-pre-wrap break-words leading-relaxed text-[15px]"
                                        dangerouslySetInnerHTML={{
                                            __html: message.content
                                                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-blue-600">$1</strong>')
                                                .replace(/^•\s+(.*?)$/gm, '<div class="flex gap-2 my-2"><span class="text-blue-600 font-bold flex-shrink-0">•</span><span class="flex-1">$1</span></div>')
                                                .replace(/^(\d+\.)\s+(.*?)$/gm, '<div class="flex gap-2 my-2"><span class="font-bold text-blue-600 flex-shrink-0">$1</span><span class="flex-1">$2</span></div>')
                                                .replace(/\n\n/g, '<div class="h-3"></div>')
                                                .replace(/([🎯📄💬📝💡🌟✅🎨✨📤👆👋🚀⚡🔥💪🎊✨🎓💼🏆📊🎪🌈])/g, '<span class="inline-block text-lg">$1</span>')
                                        }}
                                    />
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap break-words leading-relaxed text-[15px]">{message.content}</p>
                            )}
                            {message.timestamp && (
                                <p className={`text-[11px] mt-2.5 flex items-center gap-1 ${message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                                    }`}>
                                    <span className="opacity-70">🕐</span>
                                    {formatDate(message.timestamp)}
                                </p>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 shadow-sm">
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                <div>
                                    <span className="text-sm font-medium text-blue-900">AI is analyzing your document...</span>
                                    <div className="flex gap-1 mt-1">
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-3">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything about your document..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all bg-white text-gray-800 placeholder:text-gray-400 shadow-sm"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md transform hover:scale-[1.03] active:scale-95"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2.5 text-center">Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-700 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-700 font-mono text-[10px]">Shift + Enter</kbd> for new line</p>
            </div>

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
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
