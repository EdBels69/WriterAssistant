import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAppStore = create(
  persist(
    (set, get) => ({
      activeTab: 'dashboard',
      activeToolScreen: null,
      activeDropdown: null,
      isChatOpen: false,
      chatMessages: [
        { role: 'assistant', content: 'Добро пожаловать в ScientificWriter AI — ваш интеллектуальный помощник для научных исследований. Я специализируюсь на:\n\n• Генерации и проверке исследовательских гипотез\n• Систематическом обзоре литературы\n• Структурировании методологии\n• Статистическом анализе и интерпретации результатов\n• Редактировании научных текстов до академических стандартов\n\nКакой аспект вашего исследования мы можем оптимизировать сегодня?' }
      ],
      currentInput: '',
      chatMode: 'creative',
      sessionId: null,

      stats: null,
      projects: [],
      comments: [],
      loading: false,
      error: null,
      isAnalyzing: false,
      uploadedFiles: [],
      selectedProject: null,
      inputMode: 'text',
      inputText: '',
      documentType: 'scientific',
      selectedTool: null,
      textInputResult: null,
      projectAnalysisResults: [],
      projectActiveTab: 'overview',
      chapters: [],

      showTemplateSelector: false,
      selectedPipelineTemplate: null,
      showPipelineVisualization: false,
      activePipelineId: null,
      showSettings: false,
      settings: {
        primaryModel: 'glm-4.7',
        thinkingMode: 'interleaved',
        fallbackModel: 'deepseek-r1',
        textEditingModel: 'qwen',
        useCodingAPI: true,
        openRouterKey: ''
      },

      setActiveTab: (activeTab) => set({ activeTab }),
      setActiveToolScreen: (activeToolScreen) => set({ activeToolScreen }),
      setActiveDropdown: (activeDropdown) => set({ activeDropdown }),
      setIsChatOpen: (isChatOpen) => set({ isChatOpen }),
      setChatMessages: (chatMessages) => set({ chatMessages }),
      addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
      setCurrentInput: (currentInput) => set({ currentInput }),
      setChatMode: (chatMode) => set({ chatMode }),
      setSessionId: (sessionId) => set({ sessionId }),

      setStats: (stats) => set({ stats }),
      setProjects: (projects) => set({ projects }),
      setComments: (comments) => set({ comments }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
      setUploadedFiles: (uploadedFiles) => set({ uploadedFiles }),
      setSelectedProject: (selectedProject) => set({ selectedProject }),
      setInputMode: (inputMode) => set({ inputMode }),
      setInputText: (inputText) => set({ inputText }),
      setDocumentType: (documentType) => set({ documentType }),
      setSelectedTool: (selectedTool) => set({ selectedTool }),
      setTextInputResult: (textInputResult) => set({ textInputResult }),
      setProjectAnalysisResults: (projectAnalysisResults) => set({ projectAnalysisResults }),
      setProjectActiveTab: (projectActiveTab) => set({ projectActiveTab }),
      setChapters: (chapters) => set({ chapters }),

      setShowTemplateSelector: (showTemplateSelector) => set({ showTemplateSelector }),
      setSelectedPipelineTemplate: (selectedPipelineTemplate) => set({ selectedPipelineTemplate }),
      setShowPipelineVisualization: (showPipelineVisualization) => set({ showPipelineVisualization }),
      setActivePipelineId: (activePipelineId) => set({ activePipelineId }),
      setShowSettings: (showSettings) => set({ showSettings }),
      setSettings: (settings) => set({ settings }),
      updateSettings: (key, value) => set((state) => ({ settings: { ...state.settings, [key]: value } })),

      resetChat: () => set({
        chatMessages: [
          { role: 'assistant', content: 'Добро пожаловать в ScientificWriter AI — ваш интеллектуальный помощник для научных исследований. Я специализируюсь на:\n\n• Генерации и проверке исследовательских гипотез\n• Систематическом обзоре литературы\n• Структурировании методологии\n• Статистическом анализе и интерпретации результатов\n• Редактировании научных текстов до академических стандартов\n\nКакой аспект вашего исследования мы можем оптимизировать сегодня?' }
        ],
        currentInput: '',
        sessionId: null
      }),

      loadChatHistory: async (sessionId) => {
        try {
          const { chatAPI } = await import('../api/chat')
          const response = await chatAPI.getHistory(sessionId)
          if (response && response.length > 0) {
            const messages = response.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
            set({ chatMessages: messages })
          }
        } catch (error) {
          console.error('Error loading chat history:', error)
        }
      }
    }),
    {
      name: 'sw-app-storage',
      partialize: (state) => ({
        settings: state.settings,
        chatMode: state.chatMode,
        inputMode: state.inputMode,
        documentType: state.documentType
      })
    }
  )
)

export default useAppStore
