import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasServerToken: Boolean(process.env.GITHUB_TOKEN),
  })
}
