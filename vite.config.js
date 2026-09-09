import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite Configuration with Security Headers for Local Development and Preview
 * 
 * Note: These HTTP response headers protect local developer sessions from clickjacking,
 * MIME sniffing, and unauthorized feature access. In production, these and a robust CSP
 * should also be enforced at the reverse proxy / CDN edge (e.g. Nginx, Cloudflare, AWS CloudFront).
 */
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  },
  preview: {
    port: 3000,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  }
})
