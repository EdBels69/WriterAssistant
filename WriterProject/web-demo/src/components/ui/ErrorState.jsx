export default function ErrorState({ error }) {
  return (
    <div className="academic-error-container">
      <div className="academic-error-content">
        <div className="academic-error-alert" role="alert" aria-live="assertive">
          <div className="academic-error-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 2L18 10L10 18L2 10L10 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 6V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 14H10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="academic-error-message">{error}</div>
        </div>
        <p className="academic-error-hint">Убедитесь, что backend сервер запущен на порту 5001</p>
      </div>

      <style jsx>{`
        .academic-error-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--academic-paper);
          padding: var(--academic-space-md);
        }

        .academic-error-content {
          text-align: center;
          max-width: 32rem;
          width: 100%;
        }

        .academic-error-alert {
          background-color: var(--academic-error-bg);
          border: 1px solid var(--academic-error-border);
          color: var(--academic-error-text);
          padding: var(--academic-space-md);
          border-radius: var(--academic-radius-md);
          margin-bottom: var(--academic-space-md);
          display: flex;
          align-items: flex-start;
          gap: var(--academic-space-sm);
        }

        .academic-error-icon {
          flex-shrink: 0;
          width: 1.25rem;
          height: 1.25rem;
          margin-top: 0.125rem;
        }

        .academic-error-message {
          text-align: left;
          font-family: var(--academic-font-body);
          font-size: var(--academic-text-sm);
          line-height: var(--academic-leading-sm);
          word-break: break-word;
        }

        .academic-error-hint {
          color: var(--academic-text-secondary);
          font-family: var(--academic-font-body);
          font-size: var(--academic-text-sm);
          line-height: var(--academic-leading-sm);
          margin: 0;
        }

        @media (max-width: 768px) {
          .academic-error-alert {
            padding: var(--academic-space-sm);
          }
          
          .academic-error-message {
            font-size: var(--academic-text-xs);
          }
          
          .academic-error-hint {
            font-size: var(--academic-text-xs);
          }
        }
      `}</style>
    </div>
  )
}