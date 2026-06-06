import { Octokit } from 'octokit'
import { RepoStructure } from '@/frontend/types'

export function getOctokit(accessToken: string): Octokit {
  return new Octokit({ auth: accessToken })
}

export async function getUserRepos(accessToken: string) {
  const octokit = getOctokit(accessToken)
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100,
    type: 'all',
  })
  return data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner.login,
    url: repo.html_url,
    description: repo.description,
    language: repo.language,
    private: repo.private,
    defaultBranch: repo.default_branch,
  }))
}

export async function getRepoContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string = '',
  branch?: string
): Promise<RepoStructure[]> {
  const octokit = getOctokit(accessToken)
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    })

    if (Array.isArray(data)) {
      const items = await Promise.all(
        data.map(async (item) => {
          if (item.type === 'dir') {
            const children = await getRepoContent(accessToken, owner, repo, item.path, branch)
            return {
              name: item.name,
              type: 'dir' as const,
              path: item.path,
              children,
            }
          }
          return {
            name: item.name,
            type: 'file' as const,
            path: item.path,
          }
        })
      )
      return items
    }

    return [
      {
        name: data.name,
        type: 'file' as const,
        path: data.path,
      },
    ]
  } catch {
    return []
  }
}

export async function getFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  branch?: string
): Promise<string | null> {
  const octokit = getOctokit(accessToken)
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    })
    if (!Array.isArray(data) && 'content' in data && data.content) {
      return Buffer.from(data.content, 'base64').toString('utf-8')
    }
    return null
  } catch {
    return null
  }
}

export async function getRepoStructureContext(
  accessToken: string,
  owner: string,
  repo: string,
  branch?: string,
  maxDepth: number = 3
): Promise<string> {
  const structure = await getRepoContent(accessToken, owner, repo, '', branch)
  return formatStructure(structure, 0, maxDepth)
}

function formatStructure(items: RepoStructure[], depth: number, maxDepth: number): string {
  if (depth > maxDepth) return ''
  let result = ''
  for (const item of items) {
    const indent = '  '.repeat(depth)
    result += `${indent}${item.type === 'dir' ? '📁' : '📄'} ${item.name}\n`
    if (item.children && item.type === 'dir') {
      result += formatStructure(item.children, depth + 1, maxDepth)
    }
  }
  return result
}

export async function createBranch(
  accessToken: string,
  owner: string,
  repo: string,
  branchName: string,
  baseBranch: string
): Promise<void> {
  const octokit = getOctokit(accessToken)

  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  })

  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: refData.object.sha,
  })
}

export async function commitFiles(
  accessToken: string,
  owner: string,
  repo: string,
  branch: string,
  files: { path: string; content: string; action: 'create' | 'update' | 'delete' }[],
  message: string
): Promise<{ commitSha: string; commitUrl: string }> {
  const octokit = getOctokit(accessToken)

  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  })

  const baseTreeSha = refData.object.sha

  const { data: baseCommit } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: baseTreeSha,
  })

  const treeItems = await Promise.all(
    files.map(async (file) => {
      if (file.action === 'delete') {
        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: null,
        }
      }

      const { data: blobData } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content: file.content,
        encoding: 'utf-8',
      })

      return {
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blobData.sha,
      }
    })
  )

  const { data: newTree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: baseCommit.tree.sha,
    tree: treeItems,
  })

  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message,
    tree: newTree.sha,
    parents: [baseTreeSha],
  })

  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  })

  return {
    commitSha: newCommit.sha,
    commitUrl: newCommit.html_url,
  }
}

export async function createPullRequest(
  accessToken: string,
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string
): Promise<{ prNumber: number; prUrl: string }> {
  const octokit = getOctokit(accessToken)

  const { data } = await octokit.rest.pulls.create({
    owner,
    repo,
    title,
    body,
    head,
    base,
  })

  return {
    prNumber: data.number,
    prUrl: data.html_url,
  }
}

export function parseRepoFullName(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split('/')
  return { owner, repo }
}
