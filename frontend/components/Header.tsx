import React from 'react';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
    return (
        <header className="main-header">
            <div className="header-left">
                <div className="logo-container">
                    <div className="logo-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text">
                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                            <path d="M10 9H8" />
                            <path d="M16 13H8" />
                            <path d="M16 17H8" />
                        </svg>
                    </div>
                    <div className="title-stack">
                        <h1>RAG PDF Chatbot</h1>
                        <span className="subtitle">AI-Powered Document Intelligence Platform</span>
                    </div>
                </div>
            </div>
            <div className="header-right">
                <div className="pill-status">
                    <div className="dot"></div>
                    Live
                </div>
                <ThemeToggle />
            </div>

            <style jsx>{`
        .main-header {
          position: sticky;
          top: 0;
          z-index: 50;
          height: var(--header-height);
          background: var(--color-bg-surface);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
        }

        .header-left {
          display: flex;
          align-items: center;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pill-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--border-radius-full);
          background: var(--color-success-bg);
          color: var(--color-success);
          font-size: 13px;
          font-weight: 500;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-success);
          animation: live-pulse 2s ease-in-out infinite;
        }

        @keyframes live-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-hover));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .title-stack h1 {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
        }

        .subtitle {
          font-size: 13px;
          color: var(--color-text-secondary);
          font-weight: 400;
        }

        @media (max-width: 768px) {
          .main-header {
            padding: 0 20px;
          }
          .subtitle {
            display: none;
          }
        }
      `}</style>
        </header>
    );
};

export default Header;
