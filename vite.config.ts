import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// 桌面构建（VITE_BUILD_TARGET=desktop）跳过 PWA：file:// 协议下 service worker 无法注册，
// 留着只会产生无意义的控制台错误。
const isDesktop = process.env.VITE_BUILD_TARGET === 'desktop';

export default defineConfig({
  // 相对路径：Electron 以 file:// 加载 dist/index.html 时必需；
  // Web 部署使用相对路径同样兼容。
  base: './',
  server: {
    allowedHosts: ['www.u3071783.nyat.app'],
  },
  plugins: [
    react(),
    ...(isDesktop
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            manifest: {
              name: 'FlowTime',
              short_name: 'FlowTime',
              description: '心流守护者 — 保护你的深度专注',
              theme_color: '#1f2937',
              background_color: '#0a0a0a',
              display: 'standalone',
              icons: [
                { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
                { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
              navigateFallback: 'index.html',
              navigateFallbackDenylist: [/^\/api/],
            },
          }),
        ]),
  ],
});
