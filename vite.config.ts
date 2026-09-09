import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: đặt '/<tên-repo>/' khi deploy GitHub Pages dạng project page.
// Workflow deploy đã truyền sẵn VITE_BASE.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
  build: {
    // Tách chunk để cache tốt hơn: sửa nội dung câu hỏi không làm invalidate vendor.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/data/questions/') || id.includes('/src/data/stories')) return 'content'
          if (id.includes('node_modules')) {
            if (id.includes('highlight.js') || id.includes('lowlight')) return 'vendor-highlight'
            if (
              id.includes('react-markdown') ||
              id.includes('remark') ||
              id.includes('rehype') ||
              id.includes('unified') ||
              id.includes('micromark') ||
              id.includes('mdast') ||
              id.includes('hast') ||
              id.includes('unist') ||
              id.includes('vfile') ||
              id.includes('property-information') ||
              id.includes('character-entities') ||
              id.includes('decode-named-character-reference')
            )
              return 'vendor-markdown'
            if (id.includes('react')) return 'vendor-react'
          }
          return undefined
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
})
