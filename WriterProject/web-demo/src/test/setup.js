import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

afterEach(() => {
  cleanup()
})

vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:5001'
    }
  }
})
