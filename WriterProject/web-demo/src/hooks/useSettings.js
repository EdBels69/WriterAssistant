import { useCallback } from 'react'
import { commentsAPI } from '../api/comments'
import useAppStore from '../stores/appStore'

export const useSettings = () => {
  const {
    settings,
    setSettings,
    updateSettings,
    showSettings,
    setShowSettings,
    comments,
    setComments,
    chatMessages,
    currentInput,
    setCurrentInput,
    chatMode,
    setChatMode,
    loading
  } = useAppStore()

  const handleSettingsChange = useCallback((key, value) => {
    updateSettings(key, value)
    localStorage.setItem('swSettings', JSON.stringify({ ...settings, [key]: value }))
  }, [settings, updateSettings])

  const handleSaveSettings = useCallback(() => {
    localStorage.setItem('swSettings', JSON.stringify(settings))
    setShowSettings(false)
  }, [settings, setShowSettings])

  const handleLoadComments = useCallback(async (projectId) => {
    try {
      const commentsData = await commentsAPI.getAll(projectId)
      setComments(commentsData || [])
    } catch (err) {
      console.error('Error loading comments:', err)
      setComments([])
    }
  }, [setComments])

  const handleAddComment = useCallback(async (content, projectId) => {
    try {
      const newComment = await commentsAPI.create({
        projectId,
        userId: localStorage.getItem('userId') || 'demo-user',
        content
      })
      setComments([...comments, newComment])
      return newComment
    } catch (err) {
      console.error('Error adding comment:', err)
      throw err
    }
  }, [comments, setComments])

  const handleDeleteComment = useCallback(async (commentId) => {
    try {
      await commentsAPI.delete(commentId)
      setComments(comments.filter(c => c.id !== commentId))
    } catch (err) {
      console.error('Error deleting comment:', err)
      throw err
    }
  }, [comments, setComments])

  return {
    settings,
    handleSettingsChange,
    handleSaveSettings,
    handleLoadComments,
    handleAddComment,
    handleDeleteComment,
    showSettings,
    setShowSettings,
    chatMessages,
    currentInput,
    setCurrentInput,
    chatMode,
    setChatMode,
    loading
  }
}
