import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// When building in GitHub Actions, GITHUB_REPOSITORY is "owner/repo-name".
// We use the repo name as the base path so the site works at
// https://<owner>.github.io/<repo-name>/ without any manual editing.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS && repo ? `/${repo}/` : '/',
})
