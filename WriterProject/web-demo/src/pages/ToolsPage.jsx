import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, Brain, Code, BookOpen } from 'lucide-react'
import AnalysisTools from './AnalysisTools'
import useWritingAI from '../hooks/useWritingAI'
import useResearchAI from '../hooks/useResearchAI'
import useCodeAI from '../hooks/useCodeAI'
import useSettings from '../hooks/useSettings'

function ToolsPage() {
  const navigate = useNavigate()

  const {
    handleGenerateIdeas,
    handleExpandText,
    handleEditStyle,
    handleGenerateCharacter,
    handleGeneratePlot,
    handleGenerateDialogue,
    handleImproveWriting,
    handleGenerateDescription,
    handleAnalyzeText,
    handleBrainstorm,
    handleEditStyleText,
    handleProcessLargeText,
    textInputResult,
    setInputText
  } = useWritingAI()

  const {
    handleGenerateHypothesis,
    handleStructureIdeas,
    handleStructureMethodology,
    handleLiteratureReview,
    handleStatisticalAnalysis,
    handleGenerateNarrativeReview,
    handleGenerateSystematicReview,
    handleGenerateMetaAnalysis,
    handleGenerateResearchDesign,
    handleAnalyzeResults,
    handleGenerateDiscussion,
    handleGenerateConclusion,
    handleImproveAcademicStyle
  } = useResearchAI()

  const {
    handleGenerateCode,
    handleReviewCode,
    handleDebugCode,
    handleOptimizeCode,
    handleExplainCode,
    handleRefactorCode,
    handleGenerateTests,
    handleGenerateDocumentation
  } = useCodeAI()

  const { settings, handleSettingsChange, showSettings, setShowSettings } = useSettings()

  const handleBackToDashboard = () => {
    navigate('/')
  }

  const writingHandlers = {
    generateIdeas: handleGenerateIdeas,
    expandText: handleExpandText,
    editStyle: handleEditStyle,
    generateCharacter: handleGenerateCharacter,
    generatePlot: handleGeneratePlot,
    generateDialogue: handleGenerateDialogue,
    improveWriting: handleImproveWriting,
    generateDescription: handleGenerateDescription,
    analyzeText: handleAnalyzeText,
    brainstorm: handleBrainstorm,
    editStyleText: handleEditStyleText,
    processLargeText: handleProcessLargeText
  }

  const researchHandlers = {
    generateHypothesis: handleGenerateHypothesis,
    structureIdeas: handleStructureIdeas,
    structureMethodology: handleStructureMethodology,
    literatureReview: handleLiteratureReview,
    statisticalAnalysis: handleStatisticalAnalysis,
    generateNarrativeReview: handleGenerateNarrativeReview,
    generateSystematicReview: handleGenerateSystematicReview,
    generateMetaAnalysis: handleGenerateMetaAnalysis,
    generateResearchDesign: handleGenerateResearchDesign,
    analyzeResults: handleAnalyzeResults,
    generateDiscussion: handleGenerateDiscussion,
    generateConclusion: handleGenerateConclusion,
    improveAcademicStyle: handleImproveAcademicStyle
  }

  const codeHandlers = {
    generateCode: handleGenerateCode,
    reviewCode: handleReviewCode,
    debugCode: handleDebugCode,
    optimizeCode: handleOptimizeCode,
    explainCode: handleExplainCode,
    refactorCode: handleRefactorCode,
    generateTests: handleGenerateTests,
    generateDocumentation: handleGenerateDocumentation
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBackToDashboard}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">AI Tools</h1>
          </div>
        </div>

        <AnalysisTools
          writingHandlers={writingHandlers}
          researchHandlers={researchHandlers}
          codeHandlers={codeHandlers}
          textInputResult={textInputResult}
          onTextInputChange={setInputText}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          showSettings={showSettings}
          onSettingsToggle={() => setShowSettings(!showSettings)}
        />
      </div>
    </div>
  )
}

export default memo(ToolsPage)
