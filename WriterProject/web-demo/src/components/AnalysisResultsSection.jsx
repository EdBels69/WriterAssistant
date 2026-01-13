import React from 'react'
import { 
  FileText, 
  CheckCircle,
  AlertCircle,
  ChevronRight,
  X
} from 'lucide-react'

import { getToolMeta } from '../pages/AnalysisTools'

function AnalysisResultsSection({ 
  analysisResults = [], 
  onClose,
  documentName 
}) {
  if (!analysisResults || analysisResults.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-academic-teal-100 rounded-lg">
            <FileText className="text-academic-teal-600" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-academic-navy-900 text-lg">Результаты анализа</h3>
            {documentName && (
              <p className="text-sm text-academic-navy-600">{documentName}</p>
            )}
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {analysisResults.map((result, index) => {
          const meta = getToolMeta(result.tool)
          const ToolIcon = meta?.icon || FileText
          const toolName = meta?.label || result.tool
          const content = typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2)

          return (
            <div 
              key={index}
              className="p-5 bg-white rounded-lg border border-gray-200 hover:border-academic-teal-400 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-academic-teal-50 rounded-lg shrink-0">
                  <ToolIcon className="text-academic-teal-600" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-academic-navy-900">{toolName}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CheckCircle size={14} className="text-academic-emerald-500" />
                      {result.timestamp && new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="p-4 bg-academic-cream-50 rounded-lg mb-3">
                    <p className="text-sm text-academic-navy-800 leading-relaxed whitespace-pre-wrap">
                      {content || 'Анализ выполнен. Результаты будут доступны после обработки.'}
                    </p>
                  </div>
                  {result.metadata && (
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <AlertCircle size={12} />
                        {result.metadata.chunksProcessed || 0} фрагментов
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertCircle size={12} />
                        {result.metadata.tokensUsed || 0} токенов
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AnalysisResultsSection
