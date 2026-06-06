const keywords = new Set([
  'import', 'export', 'from', 'return', 'if', 'else', 'for', 'while', 'do',
  'function', 'const', 'let', 'var', 'class', 'extends', 'new', 'this',
  'async', 'await', 'try', 'catch', 'throw', 'finally', 'switch', 'case',
  'break', 'continue', 'default', 'typeof', 'instanceof', 'in', 'of',
  'interface', 'type', 'enum', 'implements', 'abstract', 'private',
  'public', 'protected', 'static', 'readonly', 'declare', 'namespace',
  'module', 'require', 'true', 'false', 'null', 'undefined', 'void',
  'any', 'string', 'number', 'boolean', 'object', 'never', 'unknown',
])

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface Token {
  text: string
  type: 'keyword' | 'string' | 'number' | 'comment' | 'operator' | 'plain'
}

function tokenize(line: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < line.length) {
    const rest = line.slice(i)

    const commentMatch = rest.match(/^(\/\/.*)/)
    if (commentMatch) {
      tokens.push({ text: commentMatch[1], type: 'comment' })
      i += commentMatch[1].length
      continue
    }

    const stringMatch = rest.match(/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/)
    if (stringMatch) {
      tokens.push({ text: stringMatch[1], type: 'string' })
      i += stringMatch[1].length
      continue
    }

    const numberMatch = rest.match(/^(\b\d+(?:\.\d+)?\b)/)
    if (numberMatch) {
      tokens.push({ text: numberMatch[1], type: 'number' })
      i += numberMatch[1].length
      continue
    }

    const keywordMatch = rest.match(/^(\b[a-zA-Z_$][\w$]*\b)/)
    if (keywordMatch) {
      const word = keywordMatch[1]
      tokens.push({ text: word, type: keywords.has(word) ? 'keyword' : 'plain' })
      i += word.length
      continue
    }

    const operatorMatch = rest.match(/^([{}()\[\]<>+\-*\/=!&|^~?:;.,]+)/)
    if (operatorMatch) {
      tokens.push({ text: operatorMatch[1], type: 'operator' })
      i += operatorMatch[1].length
      continue
    }

    tokens.push({ text: rest[0], type: 'plain' })
    i++
  }

  return tokens
}

export function highlightCode(code: string, _lang?: string): string {
  const lines = code.split('\n')
  const spans: string[] = []

  for (const line of lines) {
    const tokens = tokenize(line)
    const parts = tokens.map((t) => {
      const escaped = escapeHtml(t.text)
      if (t.type === 'plain') return escaped
      return `<span class="hl-${t.type}">${escaped}</span>`
    })
    spans.push(parts.join(''))
  }

  return spans.join('\n')
}
