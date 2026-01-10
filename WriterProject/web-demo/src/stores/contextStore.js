import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useContextStore = create(
  persist(
    (set, get) => ({
      researchContext: {
        researchTopic: '',
        hypothesis: '',
        methodology: '',
        literature: [],
        data: null,
        results: null,
        discussion: null,
        conclusion: null
      },
      uploadedFiles: [],
      extractedReferences: [],
      generatedIdeas: [],
      generatedHypotheses: [],
      structureIdeas: [],
      methodologyStructure: [],
      literatureReviews: [],
      statisticalAnalyses: [],
      styleImprovements: [],

      updateResearchContext: (key, value) => {
        set((state) => ({
          researchContext: {
            ...state.researchContext,
            [key]: value
          }
        }))
      },

      addUploadedFile: (file) => {
        set((state) => ({
          uploadedFiles: [...state.uploadedFiles, file]
        }))
      },

      addExtractedReference: (reference) => {
        set((state) => ({
          extractedReferences: [...state.extractedReferences, reference]
        }))
      },

      addGeneratedIdea: (idea) => {
        set((state) => ({
          generatedIdeas: [...state.generatedIdeas, idea]
        }))
      },

      addGeneratedHypothesis: (hypothesis) => {
        set((state) => ({
          generatedHypotheses: [...state.generatedHypotheses, hypothesis]
        }))
      },

      addStructureIdea: (idea) => {
        set((state) => ({
          structureIdeas: [...state.structureIdeas, idea]
        }))
      },

      addMethodologyStructure: (structure) => {
        set((state) => ({
          methodologyStructure: [...state.methodologyStructure, structure]
        }))
      },

      addLiteratureReview: (review) => {
        set((state) => ({
          literatureReviews: [...state.literatureReviews, review]
        }))
      },

      addStatisticalAnalysis: (analysis) => {
        set((state) => ({
          statisticalAnalyses: [...state.statisticalAnalyses, analysis]
        }))
      },

      addStyleImprovement: (improvement) => {
        set((state) => ({
          styleImprovements: [...state.styleImprovements, improvement]
        }))
      },

      clearContext: () => {
        set({
          researchContext: {
            researchTopic: '',
            hypothesis: '',
            methodology: '',
            literature: [],
            data: null,
            results: null,
            discussion: null,
            conclusion: null
          },
          uploadedFiles: [],
          extractedReferences: [],
          generatedIdeas: [],
          generatedHypotheses: [],
          structureIdeas: [],
          methodologyStructure: [],
          literatureReviews: [],
          statisticalAnalyses: [],
          styleImprovements: []
        })
      },

      getContextForStep: (stepType) => {
        const state = get()
        const context = { ...state.researchContext }
        
        switch (stepType) {
          case 'brainstorm':
            return {
              topic: context.researchTopic,
              existingIdeas: state.generatedIdeas
            }
          case 'hypothesis':
            return {
              topic: context.researchTopic,
              ideas: state.structureIdeas,
              methodology: context.methodology
            }
          case 'literature':
            return {
              topic: context.researchTopic,
              hypothesis: context.hypothesis,
              existingReviews: state.literatureReviews
            }
          case 'analysis':
            return {
              data: context.data,
              methodology: context.methodology,
              hypothesis: context.hypothesis
            }
          default:
            return context
        }
      }
    }),
    {
      name: 'context-storage',
      partialize: (state) => ({
        researchContext: state.researchContext,
        uploadedFiles: state.uploadedFiles,
        extractedReferences: state.extractedReferences,
        generatedIdeas: state.generatedIdeas,
        generatedHypotheses: state.generatedHypotheses,
        structureIdeas: state.structureIdeas,
        methodologyStructure: state.methodologyStructure,
        literatureReviews: state.literatureReviews,
        statisticalAnalyses: state.statisticalAnalyses,
        styleImprovements: state.styleImprovements
      })
    }
  )
)

export default useContextStore
