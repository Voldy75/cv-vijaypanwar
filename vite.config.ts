import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vite's preload helper is shared by every lazy route; left alone, Rollup parks it in
          // vendor-three, and then every page downloads three.js to get it.
          if (id.includes('vite/preload-helper')) return 'vendor-react'
          if (id.includes('node_modules')) {
            // 3D stack for /3d only. Must come before the 'react' rule: '@react-three' contains 'react',
            // and three.js would then be pulled into vendor-react, which every page loads.
            if (/[\\/]node_modules[\\/](three|@react-three|postprocessing|three-stdlib|three-mesh-bvh|troika-[^\\/]+|camera-controls|maath|meshline|stats-gl|@monogrid|n8ao|detect-gpu|suspend-react|its-fine|zustand|react-use-measure|@use-gesture|tunnel-rat|hls\.js)[\\/]/.test(id)) {
              return 'vendor-three'
            }
            if (id.includes('react-dom') || (id.includes('react') && !id.includes('react-markdown') && !id.includes('react-router'))) {
              return 'vendor-react'
            }
            if (id.includes('react-router') || id.includes('@remix-run')) {
              return 'vendor-router'
            }
            if (id.includes('motion')) {
              return 'vendor-motion'
            }
            // react-markdown and its deps (remark, rehype, mdast, micromark, unified, unist, hast)
            // are NOT in manualChunks — they bundle with the chat's lazy chunk automatically
          }
        },
      },
    },
  },
})
