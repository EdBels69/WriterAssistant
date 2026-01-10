import apiClient from './client'

export const aiAPI = {
  generateIdeas: (data) => apiClient.post('/ai/ideas', data),
  expandText: (data) => apiClient.post('/ai/expand', data),
  editStyle: (data) => apiClient.post('/ai/style', data),
  styleEditing: (data) => apiClient.post('/ai/style-editing', data),
  generateCharacter: (data) => apiClient.post('/ai/character', data),
  generateDialogue: (data) => apiClient.post('/ai/dialogue', data),
  improveWriting: (data) => apiClient.post('/ai/improve', data),
  generateDescription: (data) => apiClient.post('/ai/description', data),
  analyzeText: (data) => apiClient.post('/ai/analyze', data),
  brainstorm: (data) => apiClient.post('/ai/brainstorm', data),
  generateHypothesis: (data) => apiClient.post('/ai/hypothesis', data),
  structureIdeas: (data) => apiClient.post('/ai/structure-ideas', data),
  structureMethodology: (data) => apiClient.post('/ai/structure-methodology', data),
  literatureReview: (data) => apiClient.post('/ai/literature-review', data),
  statisticalAnalysis: (data) => apiClient.post('/ai/statistical-analysis', data),
  processLargeText: (data) => apiClient.post('/ai/process-large-text', data),
  generateResearchDesign: (data) => apiClient.post('/ai/research-design', data),
  analyzeResults: (data) => apiClient.post('/ai/analyze-results', data),
  generateDiscussion: (data) => apiClient.post('/ai/generate-discussion', data),
  generateConclusion: (data) => apiClient.post('/ai/generate-conclusion', data),
  improveAcademicStyle: (data) => apiClient.post('/ai/improve-academic-style', data),
  analyzeUpload: (data) => apiClient.post('/ai/analyze-upload', data),
  editUpload: (data) => apiClient.post('/ai/edit-upload', data),
  extractReferences: (data) => apiClient.post('/ai/extract-references', data),
  synthesizeUploads: (data) => apiClient.post('/ai/synthesize-uploads', data),
  
  multiAgent: {
    execute: (data) => apiClient.post('/ai/multiagent', data),
    getPipelines: () => apiClient.post('/ai/multiagent/pipelines'),
    hypothesis: (data) => apiClient.post('/ai/multiagent/hypothesis', data),
    structureIdeas: (data) => apiClient.post('/ai/multiagent/structure-ideas', data),
    literatureReview: (data) => apiClient.post('/ai/multiagent/literature-review', data),
    metaAnalysis: (data) => apiClient.post('/ai/multiagent/meta-analysis', data)
  },
  
  coding: {
    generateCode: (data) => apiClient.post('/ai/code/generate', data),
    reviewCode: (data) => apiClient.post('/ai/code/review', data),
    debugCode: (data) => apiClient.post('/ai/code/debug', data),
    optimizeCode: (data) => apiClient.post('/ai/code/optimize', data),
    explainCode: (data) => apiClient.post('/ai/code/explain', data),
    refactorCode: (data) => apiClient.post('/ai/code/refactor', data),
    generateTests: (data) => apiClient.post('/ai/code/tests', data),
    generateDocumentation: (data) => apiClient.post('/ai/code/documentation', data)
  }
}

export default aiAPI
