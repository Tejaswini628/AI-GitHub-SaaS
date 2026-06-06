import { NextResponse } from 'next/server'
import { getAuthenticatedUser, handleApiError } from '@/backend/lib/api-helpers'
import { getFileContent, parseRepoFullName } from '@/backend/lib/github'
import { planAndGenerate, planChanges, validateChanges } from '@/backend/lib/ai'
import { getRepoStructureContext } from '@/backend/lib/github'

function isRepoStructureQuestion(prompt: string): boolean {
  const normalized = prompt.toLowerCase()
  return (
    normalized.includes('what all files') ||
    normalized.includes('which files') ||
    normalized.includes('list files') ||
    normalized.includes('show files') ||
    normalized.includes('file structure') ||
    normalized.includes('repo structure') ||
    normalized.includes('repository structure')
  )
}

export async function POST(request: Request) {
  try {
    const { fullName, prompt, branch, createPR } = await request.json()

    if (!fullName || !prompt) {
      return NextResponse.json(
        { error: 'fullName and prompt are required' },
        { status: 400 }
      )
    }

    let accessToken = process.env.GITHUB_TOKEN || ''
    try {
      const auth = await getAuthenticatedUser()
      accessToken = auth.accessToken
    } catch (error) {
      if (!accessToken) {
        console.warn('Generating without GitHub context:', error)
      }
    }

    let structureText = `Repository: ${fullName}\nBranch: ${branch || 'main'}\nNo GitHub token is available, so generate a best-effort change from the user's request.`
    const relevantFileContents: Record<string, string> = {}

    if (accessToken) {
      const { owner, repo } = parseRepoFullName(fullName)
      structureText = await getRepoStructureContext(accessToken, owner, repo, branch)

      if (isRepoStructureQuestion(prompt)) {
        return NextResponse.json({
          files: [],
          explanation: `I can see this repository structure:\n\n${structureText || 'No files were returned from GitHub.'}`,
          branchName: '',
          commitMessage: '',
          validationPassed: true,
          createPR: false,
        })
      }

      const planningResult = await planChanges(structureText, '', prompt)

      for (const filePath of planningResult.filesToModify) {
        const content = await getFileContent(accessToken, owner, repo, filePath, branch)
        if (content !== null) {
          relevantFileContents[filePath] = content
        }
      }
    }

    const filesContext = Object.entries(relevantFileContents)
      .map(([path, content]) => `--- ${path} ---\n${content}`)
      .join('\n\n')

    const aiResponse = await planAndGenerate(structureText, filesContext, prompt)

    const validation = await validateChanges(prompt, aiResponse)

    if (!validation.valid) {
      return NextResponse.json({
        warning: true,
        issues: validation.issues,
        ...aiResponse,
      })
    }

    return NextResponse.json({
      ...aiResponse,
      validationPassed: true,
      createPR: createPR ?? true,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
