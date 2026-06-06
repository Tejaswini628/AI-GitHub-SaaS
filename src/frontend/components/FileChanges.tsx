'use client'

import { useState } from 'react'
import { highlightCode } from '@/frontend/lib/syntax-highlight'

interface FileChange {
  path: string
  action: string
  content: string
}

interface Props {
  files: FileChange[]
}

export function FileChanges({ files }: Props) {
  const [expandedFile, setExpandedFile] = useState<string | null>(null)

  if (!files || files.length === 0) return null

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
        <p className="text-sm font-semibold text-slate-700">
          {files.length} file{files.length !== 1 ? 's' : ''} to change
        </p>
      </div>
      <div className="max-h-64 divide-y divide-slate-200 overflow-y-auto">
        {files.map((file, i) => (
          <div key={i}>
            <button
              onClick={() =>
                setExpandedFile(expandedFile === file.path ? null : file.path)
              }
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
            >
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                  file.action === 'create'
                    ? 'bg-emerald-100 text-emerald-700'
                    : file.action === 'delete'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-sky-100 text-sky-700'
                }`}
              >
                {file.action}
              </span>
              <code className="flex-1 truncate text-sm text-slate-700">
                {file.path}
              </code>
              <svg
                className={`h-4 w-4 text-slate-400 transition-transform ${
                  expandedFile === file.path ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {expandedFile === file.path && (
              <div className="px-4 pb-3">
                <pre className="max-h-48 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100 shadow-inner">
                  <code dangerouslySetInnerHTML={{ __html: highlightCode(file.content) }} />
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
