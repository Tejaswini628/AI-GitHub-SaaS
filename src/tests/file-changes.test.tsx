import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FileChanges } from '@/frontend/components/FileChanges'

describe('FileChanges', () => {
  it('renders file list', () => {
    const files = [
      { path: 'src/test.ts', action: 'create', content: 'const x = 1' },
    ]
    render(<FileChanges files={files} />)
    expect(screen.getByText('src/test.ts')).toBeInTheDocument()
    expect(screen.getByText('create')).toBeInTheDocument()
  })

  it('shows file count', () => {
    const files = [
      { path: 'a.ts', action: 'create', content: '' },
      { path: 'b.ts', action: 'update', content: '' },
    ]
    render(<FileChanges files={files} />)
    expect(screen.getByText('2 files to change')).toBeInTheDocument()
  })

  it('returns null for empty files', () => {
    const { container } = render(<FileChanges files={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('handles null files', () => {
    const { container } = render(<FileChanges files={null as any} />)
    expect(container.innerHTML).toBe('')
  })
})
