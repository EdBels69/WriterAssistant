import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const usePipelineStore = create(
  persist(
    (set, get) => ({
      pipelines: [],
      activePipeline: null,
      activeStep: null,
      stepResults: {},
      isPaused: false,

      addPipeline: (pipeline) => {
        set((state) => ({
          pipelines: [...state.pipelines, pipeline],
          activePipeline: pipeline?.id ?? state.activePipeline
        }))
      },

      createPipeline: (name, type) => {
        const pipeline = {
          id: Date.now(),
          name,
          type,
          status: 'idle',
          createdAt: new Date().toISOString(),
          steps: [],
          currentStepIndex: 0
        }
        set((state) => ({
          pipelines: [...state.pipelines, pipeline],
          activePipeline: pipeline.id
        }))
        return pipeline
      },

      setActivePipeline: (pipelineId) => set({ activePipeline: pipelineId }),

      setIsPaused: (isPaused) => set({ isPaused: Boolean(isPaused) }),

      addStep: (pipelineId, step) => {
        set((state) => ({
          pipelines: state.pipelines.map((p) =>
            p.id === pipelineId
              ? { ...p, steps: [...p.steps, { ...step, id: Date.now(), status: 'pending' }] }
              : p
          )
        }))
      },

      setActiveStep: (stepId) => set({ activeStep: stepId }),

      updateStepStatus: (pipelineId, stepId, status, result = null) => {
        set((state) => {
          const updatedPipelines = state.pipelines.map((p) =>
            p.id === pipelineId
              ? {
                  ...p,
                  steps: p.steps.map((s) =>
                    s.id === stepId ? { ...s, status, result } : s
                  )
                }
              : p
          )
          return {
            pipelines: updatedPipelines,
            stepResults: result
              ? { ...state.stepResults, [stepId]: result }
              : state.stepResults
          }
        })
      },

      setStepResult: (stepId, result) => {
        set((state) => ({
          stepResults: { ...state.stepResults, [stepId]: result }
        }))
      },

      getStepResult: (stepId) => {
        return get().stepResults[stepId]
      },

      pausePipeline: () => set({ isPaused: true }),
      resumePipeline: () => set({ isPaused: false }),

      resetPipeline: (pipelineId) => {
        set((state) => ({
          pipelines: state.pipelines.map((p) =>
            p.id === pipelineId
              ? {
                  ...p,
                  steps: p.steps.map((s) => ({ ...s, status: 'pending', result: null })),
                  currentStepIndex: 0,
                  status: 'idle'
                }
              : p
          )
        }))
      },

      deletePipeline: (pipelineId) => {
        set((state) => ({
          pipelines: state.pipelines.filter((p) => p.id !== pipelineId),
          activePipeline: state.activePipeline === pipelineId ? null : state.activePipeline
        }))
      }
    }),
    {
      name: 'pipeline-storage',
      partialize: (state) => ({
        pipelines: state.pipelines,
        activePipeline: state.activePipeline,
        stepResults: state.stepResults
      })
    }
  )
)

export default usePipelineStore
