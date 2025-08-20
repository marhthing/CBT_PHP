import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    
    // Environment variables configuration
    define: {
      __APP_ENV__: env.VITE_NODE_ENV || mode,
    },
    
    // Development server configuration
    server: {
      host: '0.0.0.0',
      port: 5000,
      allowedHosts: true,
      hmr: {
        port: 5000,
        clientPort: 443
      },
      // Only proxy in development mode when using relative API URLs
      ...(mode === 'development' && {
        proxy: {
          '/api': {
            target: (env.VITE_API_BASE_URL && env.VITE_API_BASE_URL.indexOf('http') === 0) 
              ? env.VITE_API_BASE_URL.replace('/api', '') 
              : 'http://0.0.0.0:8000',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/api/, ''),
            configure: (proxy, options) => {
              proxy.on('proxyReq', (proxyReq, req, res) => {
                proxyReq.setHeader('Origin', 'http://0.0.0.0:5000');
                console.log('Proxy request:', req.method, req.url, 'Headers:', req.headers);
              });
            }
          }
        }
      })
    },
    
    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            api: ['axios', '@tanstack/react-query']
          }
        }
      }
    },
    
    // Path alias
    resolve: {
      alias: {
        "@": new URL("./src", import.meta.url).pathname,
      },
    },
  }
})
