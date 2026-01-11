import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EntryPoints from './EntryPoints'

describe('EntryPoints', () => {
  const mockSetInputMode = vi.fn()
  const mockSetInputText = vi.fn()

  const defaultProps = {
    inputMode: 'file',
    setInputMode: mockSetInputMode,
    inputText: '',
    setInputText: mockSetInputText
  }

  it('должен рендерить кнопки выбора режима ввода', () => {
    render(<EntryPoints {...defaultProps} />)
    
    expect(screen.getByText(/ввод текста/i)).toBeInTheDocument()
    expect(screen.getByText(/загрузка файлов/i)).toBeInTheDocument()
  })

  it('должен переключать режим ввода на файл', async () => {
    const user = userEvent.setup()
    render(<EntryPoints {...defaultProps} />)
    
    const fileButton = screen.getByText(/загрузка файлов/i)
    await user.click(fileButton)
    
    expect(mockSetInputMode).toHaveBeenCalledWith('file')
  })

  it('должен переключать режим ввода на текст', async () => {
    const user = userEvent.setup()
    render(<EntryPoints {...defaultProps} />)
    
    const textButton = screen.getByText(/ввод текста/i)
    await user.click(textButton)
    
    expect(mockSetInputMode).toHaveBeenCalledWith('text')
  })

  it('должен отображать текстовое поле при режиме text', () => {
    render(<EntryPoints {...defaultProps} inputMode="text" />)
    
    const textarea = screen.getByPlaceholderText(/вставьте текст для обработки/i)
    expect(textarea).toBeInTheDocument()
  })

  it('должен обновлять текст при вводе', async () => {
    const user = userEvent.setup()
    render(<EntryPoints {...defaultProps} inputMode="text" />)
    
    const textarea = screen.getByPlaceholderText(/вставьте текст для обработки/i)
    await user.type(textarea, 'Тестовый текст')
    
    expect(mockSetInputText).toHaveBeenCalled()
    expect(mockSetInputText).toHaveBeenCalledTimes(14)
  })
})
