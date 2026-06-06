import { AIResponse } from '@/frontend/types'
import { validateFileChanges } from './validate'

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
  error?: {
    message?: string
  }
}

const getGeminiApiKey = (): string => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY environment variable is required. OPENAI_API_KEY is also supported as a fallback.'
    )
  }
  return apiKey
}

async function generateGeminiText({
  system,
  user,
  temperature,
  maxTokens,
  json = false,
}: {
  system: string
  user: string
  temperature: number
  maxTokens: number
  json?: boolean
}): Promise<string> {
  const apiKey = getGeminiApiKey()
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: system }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: user }],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        ...(json ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  })

  const data = (await response.json()) as GeminiResponse

  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini API request failed with status ${response.status}`)
  }

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || ''
  if (!text) throw new Error('Gemini returned an empty response')

  return text
}

function buildSystemPrompt(repoStructure: string, relevantFiles: string): string {
  return `You are an expert full-stack software engineer acting as an AI junior developer.
Your task is to analyze a GitHub repository and implement user requests by generating file changes.

## Repository Structure:
${repoStructure}

## Relevant File Contents:
${relevantFiles}

## Rules:
1. Analyze the user's request carefully in context of the existing codebase
2. Plan minimal, focused changes — don't rewrite files unless necessary
3. Generate VALID code that follows the project's existing patterns and conventions
4. Return structured JSON output with file paths relative to repo root
5. NEVER modify: .env, node_modules/, package-lock.json, yarn.lock, .gitignore (unless adding to it)
6. Create new files when needed, update existing files when possible
7. Use the SAME libraries, framework, and coding style as the existing code
8. If the project has a package.json, check if new dependencies are needed and update it

## Output Format:
You MUST respond with valid JSON only (no markdown fences, no extra text):
{
  "files": [
    {
      "path": "relative/file/path",
      "content": "file content here",
      "action": "create" | "update" | "delete"
    }
  ],
  "explanation": "Brief explanation of what was done",
  "branchName": "descriptive-branch-name",
  "commitMessage": "Concise commit message describing changes"
}`
}

async function getRelevantFiles(
  repoStructure: string,
  prompt: string
): Promise<string[]> {
  const text = await generateGeminiText({
    system: `Given a repository structure and a user request, identify which files are most relevant to inspect.
Return ONLY a JSON array of file paths (strings) that need to be read to implement the request.
Keep it to at most 8 files. Example: ["src/app.js", "src/components/Header.js"]`,
    user: `Repo Structure:\n${repoStructure}\n\nUser Request: ${prompt}`,
    temperature: 0.3,
    maxTokens: 500,
    json: true,
  })

  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return []
  }
}

export async function planAndGenerate(
  repoStructure: string,
  relevantFileContents: string,
  prompt: string
): Promise<AIResponse> {
  const systemPrompt = buildSystemPrompt(repoStructure, relevantFileContents)

  const text = await generateGeminiText({
    system: systemPrompt,
    user: prompt,
    temperature: 0.4,
    maxTokens: 4000,
    json: true,
  })

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse AI response as JSON')

  const parsed: AIResponse = JSON.parse(jsonMatch[0])

  validateFileChanges(parsed.files)

  return parsed
}

export async function planChanges(
  repoStructure: string,
  relevantFileContents: string,
  prompt: string
): Promise<{ plan: string; filesToModify: string[] }> {
  const text = await generateGeminiText({
    system: `You are a senior engineer planning code changes.
Given a repo structure, file contents, and a user request, output a JSON plan:
{
  "plan": "Step-by-step explanation of changes needed",
  "filesToModify": ["path/to/file1.js", "path/to/file2.js"]
}
Keep the plan concise but thorough.`,
    user: `Repo Structure:\n${repoStructure}\n\nFile Contents:\n${relevantFileContents}\n\nRequest: ${prompt}`,
    temperature: 0.3,
    maxTokens: 1000,
    json: true,
  })

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse plan as JSON')
  return JSON.parse(jsonMatch[0])
}

export async function validateChanges(
  prompt: string,
  aiResponse: AIResponse
): Promise<{ valid: boolean; issues: string[] }> {
  const text = await generateGeminiText({
    system: `You are a code reviewer validating AI-generated changes.
Check for:
1. Syntax errors or broken imports
2. Missing dependencies
3. Security issues (hardcoded secrets, path traversal)
4. Consistency with project patterns
5. Incomplete implementations

Output JSON: { "valid": boolean, "issues": string[] }`,
    user: `Original Request: ${prompt}\n\nGenerated Changes:\n${JSON.stringify(aiResponse, null, 2)}`,
    temperature: 0.2,
    maxTokens: 1000,
    json: true,
  })

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { valid: true, issues: [] }

  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return { valid: true, issues: [] }
  }
}
