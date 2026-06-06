'use client'

import { useState, useRef, useEffect } from 'react'
import { FileChanges } from './FileChanges'

interface Message {
  role: 'user' | 'assistant' | 'system' | 'plan'
  content: string
  files?: { path: string; action: string; content: string }[]
  plan?: string
}

interface Props {
  repo: { id: string; fullName: string; defaultBranch: string }
  onTaskComplete: () => void
}

export function ChatInterface({ repo, onTaskComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `I'm analyzing ${repo.fullName}. What would you like me to build or fix?`,
    },
  ])
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)
  const [createPR, setCreatePR] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || generating) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setGenerating(true)
    setAiResult(null)

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: repo.fullName,
          prompt: userMessage,
          branch: repo.defaultBranch,
          createPR,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to generate code')
      }

      const data = await res.json()
      setAiResult(data)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.explanation || 'Generated code changes.',
          files: data.files?.map((f: any) => ({
            path: f.path,
            action: f.action,
            content: f.content,
          })),
          plan: data.plan,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}`,
        },
      ])
    } finally {
      setGenerating(false)
    }
  }

  async function handleCommit() {
    if (!aiResult) return
    setCommitting(true)

    try {
      const res = await fetch('/api/github/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId: repo.id,
          fullName: repo.fullName,
          defaultBranch: repo.defaultBranch,
          aiResponse: aiResult,
          createPR,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to commit')
      }

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `Changes committed successfully.\n\nBranch: ${data.branchName}\nCommit: ${data.commitSha.slice(0, 7)}\n${
            data.prUrl ? `Pull Request: #${data.prNumber}` : ''
          }\n\nFiles changed: ${data.filesChanged}`,
        },
      ])
      setAiResult(null)
      onTaskComplete()
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `Commit failed: ${err instanceof Error ? err.message : 'Something went wrong'}`,
        },
      ])
    } finally {
      setCommitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="card flex h-[640px] flex-col p-0">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-950">AI workspace</h2>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {repo.fullName} on {repo.defaultBranch}
          </p>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={createPR}
            onChange={(e) => setCreatePR(e.target.checked)}
            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          Create PR
        </label>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[86%] rounded-lg px-4 py-3 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'bg-slate-950 text-white shadow-slate-950/10'
                  : msg.role === 'system'
                  ? 'border border-amber-200 bg-amber-50 text-amber-900'
                  : 'border border-slate-200 bg-slate-50 text-slate-900'
              }`}
            >
              <div className="whitespace-pre-wrap leading-6">{msg.content}</div>
              {msg.files && msg.files.length > 0 && (
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <p className="mb-2 text-xs font-semibold text-slate-500">
                    Files to change
                  </p>
                  <div className="space-y-1">
                    {msg.files.map((file, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs">
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
                        <code className="truncate text-slate-600">{file.path}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {generating && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-600" />
                Analyzing code and generating changes...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {aiResult && !committing && (
        <div className="border-t border-slate-200 bg-white px-5 py-4">
          <FileChanges files={aiResult.files || []} />
          <button
            onClick={handleCommit}
            className="btn-primary mt-3 w-full text-sm"
          >
            Commit and push to GitHub
          </button>
        </div>
      )}

      {committing && (
        <div className="mx-5 mb-4 rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm text-primary-700">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-600" />
            Committing changes to GitHub...
          </div>
        </div>
      )}

      <div className="flex gap-2 border-t border-slate-200 bg-slate-50/80 p-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask for a focused change, bug fix, refactor, or test..."
          className="input-field resize-none text-sm"
          rows={2}
          disabled={generating}
        />
        <button
          onClick={handleSend}
          disabled={generating || !input.trim()}
          className="btn-primary shrink-0 px-6"
        >
          Send
        </button>
      </div>
    </div>
  )
}
