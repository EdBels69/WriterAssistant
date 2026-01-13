import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import EntryPoints from '../EntryPoints'

const mockSetInputMode = vi.fn()
const mockSetInputText = vi.fn()
const mockSetUploadedFiles = vi.fn()

const defaultProps = {
  inputMode: 'file',
  setInputMode: mockSetInputMode,
  inputText: '',
  setInputText: mockSetInputText,
  uploadedFiles: [],
  setUploadedFiles: mockSetUploadedFiles
}

describe('EntryPoints Stress Tests - File Upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  describe('File Size Validation', () => {
    it('должен отклонять файл > 50MB', () => {
      render(<EntryPoints {...defaultProps} />)

      const largeFile = new File([new Uint8Array(52 * 1024 * 1024)], 'large.txt', {
        type: 'text/plain'
      })

      const input = screen.getByLabelText(/upload files/i)
      act(() => {
        fireEvent.change(input, { target: { files: [largeFile] } })
      })

      expect(screen.getByText(/превышает лимит 50\s*mb/i)).toBeInTheDocument()
      expect(mockSetUploadedFiles).not.toHaveBeenCalled()
    })

    it('должен принимать файл 50MB', () => {
      render(<EntryPoints {...defaultProps} />)

      const file = new File([new Uint8Array(50 * 1024 * 1024)], '50mb.txt', {
        type: 'text/plain'
      })

      const input = screen.getByLabelText(/upload files/i)
      act(() => {
        fireEvent.change(input, { target: { files: [file] } })
      })

      expect(screen.queryByText(/превышает лимит 50\s*mb/i)).not.toBeInTheDocument()
    })

    it('должен отклонять общий размер > 100MB', () => {
      render(<EntryPoints {...defaultProps} uploadedFiles={[
        new File([new Uint8Array(60 * 1024 * 1024)], 'existing.txt', { type: 'text/plain' })
      ]} />)

      const newFile = new File([new Uint8Array(45 * 1024 * 1024)], 'new.txt', {
        type: 'text/plain'
      })

      const input = screen.getByLabelText(/upload files/i)
      act(() => {
        fireEvent.change(input, { target: { files: [newFile] } })
      })

      expect(screen.getByText(/общий размер файлов превышает лимит 100\s*mb/i)).toBeInTheDocument()
    })

    it('должен принимать общий размер 100MB', () => {
      render(<EntryPoints {...defaultProps} uploadedFiles={[
        new File([new Uint8Array(50 * 1024 * 1024)], 'existing.txt', { type: 'text/plain' })
      ]} />)

      const newFile = new File([new Uint8Array(50 * 1024 * 1024)], 'new.txt', {
        type: 'text/plain'
      })

      const input = screen.getByLabelText(/upload files/i)
      act(() => {
        fireEvent.change(input, { target: { files: [newFile] } })
      })

      expect(screen.queryByText(/общий размер файлов превышает лимит 100\s*mb/i)).not.toBeInTheDocument()
    })
  })

  describe('File Format Validation', () => {
    it('должен отклонять .exe файлы', () => {
      render(<EntryPoints {...defaultProps} />)

      const exeFile = new File(['content'], 'malware.exe', {
        type: 'application/x-msdownload'
      })

      const input = screen.getByLabelText(/upload files/i)
      act(() => {
        fireEvent.change(input, { target: { files: [exeFile] } })
      })

      expect(screen.getByText(/неподдерживаемый формат/i)).toBeInTheDocument()
    })

    it('должен отклонять файлы без расширения', () => {
      render(<EntryPoints {...defaultProps} />)

      const file = new File(['content'], 'noextension', {
        type: 'text/plain'
      })

      const input = screen.getByLabelText(/upload files/i)
      act(() => {
        fireEvent.change(input, { target: { files: [file] } })
      })

      expect(screen.getByText(/неподдерживаемый формат/i)).toBeInTheDocument()
    })

    it('должен принимать все поддерживаемые форматы', () => {
      render(<EntryPoints {...defaultProps} />)

      const files = [
        new File(['content'], 'test.txt', { type: 'text/plain' }),
        new File(['content'], 'test.md', { type: 'text/markdown' }),
        new File(['content'], 'test.json', { type: 'application/json' }),
        new File(['content'], 'test.csv', { type: 'text/csv' }),
        new File(['content'], 'test.pdf', { type: 'application/pdf' }),
        new File(['content'], 'test.doc', { type: 'application/msword' }),
        new File(['content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      ]

      const input = screen.getByLabelText(/upload files/i)
      act(() => {
        fireEvent.change(input, { target: { files } })
      })

      expect(screen.queryByText(/неподдерживаемый формат/i)).not.toBeInTheDocument()
    })
  })

  describe('Multiple File Upload', () => {
    it('должен обрабатывать 10 файлов одновременно', () => {
      render(<EntryPoints {...defaultProps} />)

      const files = Array(10).fill(0).map((_, i) =>
        new File([`content${i}`], `file${i}.txt`, { type: 'text/plain' })
      )

      const input = screen.getByLabelText(/upload files/i)
      act(() => {
        fireEvent.change(input, { target: { files } })
      })

      expect(mockSetUploadedFiles).toHaveBeenCalled()
    })

    it('должен обрабатывать 50 файлов', () => {
      render(<EntryPoints {...defaultProps} />)

      const files = Array(50).fill(0).map((_, i) =>
        new File([`content${i}`], `file${i}.txt`, { type: 'text/plain' })
      )

      const input = screen.getByLabelText(/upload files/i)
      act(() => {
        fireEvent.change(input, { target: { files } })
      })

      expect(mockSetUploadedFiles).toHaveBeenCalled()
    })

    it('должен отклонять файлы если общий размер превышен при множественной загрузке', () => {
      render(<EntryPoints {...defaultProps} />)

      const files = [
        new File([new Uint8Array(35 * 1024 * 1024)], 'file1.txt', { type: 'text/plain' }),
        new File([new Uint8Array(35 * 1024 * 1024)], 'file2.txt', { type: 'text/plain' }),
        new File([new Uint8Array(35 * 1024 * 1024)], 'file3.txt', { type: 'text/plain' })
      ]

      const input = screen.getByLabelText(/upload files/i)
      act(() => {
        fireEvent.change(input, { target: { files } })
      })

      expect(screen.getByText(/общий размер файлов превышает лимит 100\s*mb/i)).toBeInTheDocument()
    })
  })

  describe('Error Messages', () => {
    it('должен показывать отдельное сообщение для каждого типа ошибки', () => {
      render(<EntryPoints {...defaultProps} />)

      const largeFile = new File([new Uint8Array(52 * 1024 * 1024)], 'large.txt', {
        type: 'text/plain'
      })

      const input = screen.getByLabelText(/upload files/i)
      act(() => {
        fireEvent.change(input, { target: { files: [largeFile] } })
      })

      expect(screen.getByText(/превышает лимит 50\s*mb/i)).toBeInTheDocument()
    })

    it('должен автоматически скрывать ошибку через 5 секунд', () => {
      render(<EntryPoints {...defaultProps} />)

      const largeFile = new File([new Uint8Array(52 * 1024 * 1024)], 'large.txt', {
        type: 'text/plain'
      })

      const input = screen.getByLabelText(/upload files/i)
      act(() => {
        fireEvent.change(input, { target: { files: [largeFile] } })
      })

      expect(screen.getByText(/превышает лимит 50\s*mb/i)).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(screen.queryByText(/превышает лимит 50\s*mb/i)).not.toBeInTheDocument()
    })
  })

  describe('Memory Management', () => {
    it('должен корректно обрабатывать удаление файлов', () => {
      render(<EntryPoints {...defaultProps} uploadedFiles={[
        new File(['content'], 'file1.txt', { type: 'text/plain' })
      ]} />)

      const removeButtons = screen.getAllByRole('button', { name: /удалить/i })
      act(() => {
        removeButtons[0].click()
      })

      expect(mockSetUploadedFiles).toHaveBeenCalledWith([])
    })

    it('должен очищать состояние при смене режима', () => {
      render(<EntryPoints {...defaultProps} />)

      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const input = screen.getByLabelText(/upload files/i)

      act(() => {
        fireEvent.change(input, { target: { files: [file] } })
      })

      act(() => {
        const textButton = screen.getByText(/ввод текста/i)
        textButton.click()
      })

      expect(mockSetInputMode).toHaveBeenCalledWith('text')
    })
  })

  describe('Edge Cases', () => {
    it('должен обрабатывать пустой файл (0 bytes)', () => {
      render(<EntryPoints {...defaultProps} />)

      const emptyFile = new File([''], 'empty.txt', { type: 'text/plain' })
      const input = screen.getByLabelText(/upload files/i)

      act(() => {
        fireEvent.change(input, { target: { files: [emptyFile] } })
      })

      expect(screen.queryByText(/превышает лимит 50\s*mb/i)).not.toBeInTheDocument()
    })

    it('должен обрабатывать файл с размером точно 50MB', () => {
      render(<EntryPoints {...defaultProps} />)

      const exactSizeFile = new File([new Uint8Array(50 * 1024 * 1024)], 'exact50.txt', {
        type: 'text/plain'
      })
      const input = screen.getByLabelText(/upload files/i)

      act(() => {
        fireEvent.change(input, { target: { files: [exactSizeFile] } })
      })

      expect(screen.queryByText(/превышает лимит 50\s*mb/i)).not.toBeInTheDocument()
    })

    it('должен обрабатывать файл с размером 50MB + 1 byte', () => {
      render(<EntryPoints {...defaultProps} />)

      const overSizeFile = new File([new Uint8Array(50 * 1024 * 1024 + 1)], 'over50.txt', {
        type: 'text/plain'
      })
      const input = screen.getByLabelText(/upload files/i)

      act(() => {
        fireEvent.change(input, { target: { files: [overSizeFile] } })
      })

      expect(screen.getByText(/превышает лимит 50\s*mb/i)).toBeInTheDocument()
    })
  })
})
