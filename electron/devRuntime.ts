import { app } from "electron"
import os from "node:os"
import path from "node:path"

const DEFAULT_DEV_PORT = 5181

const PORT_BY_WORKTREE: Record<string, number> = {
  'natively-cluely-ai-assistant': 5181,
  'natively-codex': 5182,
  'natively-sonnet': 5183,
  'natively-upstream-clean': 5184,
}

function parsePort(value?: string): number | null {
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function sanitizeWorktreeName(value: string): string {
  const sanitized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return sanitized || "default"
}

function getDefaultAppDataPath(): string {
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support")
  }

  if (process.platform === "win32") {
    return process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming")
  }

  return process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config")
}

export function getDevWorktreeName(): string {
  return process.env.NATIVELY_WORKTREE_NAME || path.basename(app.getAppPath())
}

export function getDevServerPort(): number {
  const explicitPort = parsePort(process.env.NATIVELY_DEV_PORT)
  if (explicitPort !== null) return explicitPort

  return PORT_BY_WORKTREE[getDevWorktreeName()] || DEFAULT_DEV_PORT
}

export function getRendererBaseUrl(): string {
  return `http://localhost:${getDevServerPort()}`
}

export function getDevUserDataPath(): string {
  if (process.env.NATIVELY_DEV_USER_DATA) {
    return process.env.NATIVELY_DEV_USER_DATA
  }

  const safeWorktreeName = sanitizeWorktreeName(getDevWorktreeName())
  return path.join(getDefaultAppDataPath(), `natively-dev-${safeWorktreeName}`)
}

export function getDevSessionDataPath(): string {
  return path.join(getDevUserDataPath(), "session-data")
}

export function getDevRuntimeLabel(): string {
  const branch = process.env.NATIVELY_GIT_BRANCH || 'unknown-branch'
  return `${getDevWorktreeName()} (${branch}) @ ${getRendererBaseUrl()} userData=${getDevUserDataPath()}`
}
