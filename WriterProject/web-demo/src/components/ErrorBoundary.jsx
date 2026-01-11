import React, { Component } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border-2 border-red-200 rounded-xl" role="alert" aria-live="assertive">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle size={24} className="text-red-600" />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-red-900 text-lg mb-2">
                {this.props.fallbackTitle || 'Ошибка загрузки компонента'}
              </h3>
              <p className="text-sm text-red-700 mb-4">
                {this.props.fallbackMessage || 'Не удалось загрузить компонент. Попробуйте обновить страницу.'}
              </p>
              
              {this.state.error && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm font-medium text-red-800 hover:text-red-900">
                    Подробности ошибки
                  </summary>
                  <div className="mt-2 p-3 bg-red-100 rounded-lg">
                    <p className="text-xs text-red-900 font-mono overflow-auto max-h-32">
                      {this.state.error.toString()}
                    </p>
                  </div>
                </details>
              )}
              
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <RefreshCw size={16} />
                {this.props.resetButtonText || 'Попробовать снова'}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
