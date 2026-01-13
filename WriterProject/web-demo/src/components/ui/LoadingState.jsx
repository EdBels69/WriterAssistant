export default function LoadingState() {
  return (
    <div className="academic-loading-container">
      <div className="academic-loading-content">
        <div className="academic-loading-spinner" role="status" aria-label="Загрузка">
          <div className="academic-loading-circle"></div>
        </div>
        <p className="academic-loading-text">Загрузка...</p>
      </div>

      <style jsx>{`
        .academic-loading-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--academic-paper);
        }

        .academic-loading-content {
          text-align: center;
        }

        .academic-loading-spinner {
          display: inline-block;
          position: relative;
        }

        .academic-loading-circle {
          width: 3rem;
          height: 3rem;
          border: 2px solid var(--academic-border-light);
          border-top: 2px solid var(--academic-blue);
          border-radius: 50%;
          animation: academic-spin 1s linear infinite;
        }

        .academic-loading-text {
          margin-top: var(--academic-space-md);
          color: var(--academic-text-secondary);
          font-family: var(--academic-font-body);
          font-size: var(--academic-text-base);
          line-height: var(--academic-leading-base);
        }

        @keyframes academic-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .academic-loading-circle {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}