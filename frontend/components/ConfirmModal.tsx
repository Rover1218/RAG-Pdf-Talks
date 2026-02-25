'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger'
}: ConfirmModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    const handleConfirm = () => {
        onConfirm();
    };

    const modalContent = (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onClose} />
            <div className={`modal-content animate-scale-in ${type}`}>
                <div className="modal-header">
                    <div className="modal-icon">
                        {type === 'danger' && (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        )}
                        {type === 'warning' && (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        )}
                    </div>
                    <h3>{title}</h3>
                </div>
                <p className="modal-message">{message}</p>
                <div className="modal-actions">
                    <button className="cancel-button" onClick={onClose}>{cancelText}</button>
                    <button className={`confirm-button ${type}`} onClick={handleConfirm}>{confirmText}</button>
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .modal-backdrop {
                    position: absolute;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.65);
                    backdrop-filter: blur(8px);
                }

                .modal-content {
                    position: relative;
                    background: var(--color-bg-surface);
                    border-radius: 20px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    width: 100%;
                    max-width: 440px;
                    padding: 32px;
                    border: 1px solid var(--color-border);
                }

                .modal-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 16px;
                }

                .modal-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .danger .modal-icon { background: #FFE4E6; color: #E11D48; }
                .warning .modal-icon { background: #FEF3C7; color: #D97706; }
                .info .modal-icon { background: #F1F5F9; color: #3B82F6; }

                h3 { font-size: 20px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
                .modal-message { 
                    font-size: 15px; 
                    color: var(--color-text-secondary); 
                    margin-bottom: 32px;
                    line-height: 1.6;
                }

                .modal-actions {
                    display: flex;
                    gap: 12px;
                }

                .modal-actions button {
                    flex: 1;
                    padding: 14px;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 600;
                    transition: all 200ms ease;
                }

                .cancel-button {
                    background: white;
                    color: #64748B;
                    border: 1px solid #E2E8F0;
                }

                .cancel-button:hover { 
                    background: #F8FAFC;
                    border-color: #CBD5E1;
                }

                .confirm-button { color: white; border: none; }
                .confirm-button.danger { background: #E11D48; }
                .confirm-button.danger:hover { 
                    background: #BE123C; 
                    box-shadow: 0 10px 15px -3px rgba(225, 29, 72, 0.3);
                    transform: translateY(-1px);
                }
                .confirm-button.warning { background: #D97706; }
                .confirm-button.info { background: #3B82F6; }

                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-scale-in { animation: scale-in 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );

    return createPortal(modalContent, document.body);
}
