import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 5000,
        allowedHosts: true,
        hmr: {
            port: 5000,
            clientPort: 443
        },
        proxy: {
            '/api': {
                target: 'http://0.0.0.0:8000',
                changeOrigin: true,
                secure: false,
                rewrite: function (path) { return path.replace(/^\/api/, ''); },
                configure: function (proxy, options) {
                    proxy.on('proxyReq', function (proxyReq, req, res) {
                        proxyReq.setHeader('Origin', 'http://0.0.0.0:5000');
                        console.log('Proxy request:', req.method, req.url, 'Headers:', req.headers);
                    });
                }
            }
        }
    },
    resolve: {
        alias: {
            "@": new URL("./src", import.meta.url).pathname,
        },
    },
});
