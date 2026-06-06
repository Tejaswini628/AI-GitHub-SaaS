export interface FileChange {
  path: string
  content: string
  action: 'create' | 'update' | 'delete'
}

export interface AIResponse {
  files: FileChange[]
  explanation: string
  branchName: string
  commitMessage: string
}

export interface RepoStructure {
  name: string
  type: 'file' | 'dir'
  path: string
  content?: string
  children?: RepoStructure[]
}

export interface User {
  id: string
  auth_id: string
  name: string | null
  email: string | null
  github_id: string | null
  github_username: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Repository {
  id: string
  github_id: number
  name: string
  full_name: string
  owner: string
  url: string
  description: string | null
  language: string | null
  private: boolean
  default_branch: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface Task {
  id: string
  prompt: string
  status: string
  branch_name: string | null
  commit_message: string | null
  pr_url: string | null
  pr_number: number | null
  result: string | null
  files_changed: number
  created_at: string
  updated_at: string
  user_id: string
  repo_id: string
  repo?: Pick<Repository, 'name' | 'full_name' | 'url'>
  commits?: Pick<CommitLog, 'id' | 'message' | 'sha' | 'url' | 'files_count' | 'created_at'>[]
}

export interface CommitLog {
  id: string
  message: string
  sha: string
  url: string
  files_count: number
  created_at: string
  task_id: string
}

export interface TaskWithRepo extends Task {
  repo: Pick<Repository, 'name' | 'full_name' | 'url'>
  commits: Pick<CommitLog, 'id' | 'message' | 'sha' | 'url' | 'files_count' | 'created_at'>[]
}
