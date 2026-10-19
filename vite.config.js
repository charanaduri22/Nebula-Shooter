import { defineConfig } from 'vite';

export default defineConfig({
  // base: './' makes all asset URLs relative — works on GitHub Pages
  // subdirectory paths AND Vercel root deployments without any config
  base: './',

  server: {
    port: 3000,
    open: true,
    host: true,   // expose on LAN so mobile can connect for testing
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,

    // Target modern browsers — no legacy polyfills bloating the bundle
    target: 'es2020',

    // Use rollup-native minification (no separate terser install needed)
    minify: 'esbuild',

    // No source maps in the dist output — smaller, nothing to reverse-engineer
    sourcemap: false,

    rollupOptions: {
      output: {
        // Human-readable chunk names for easier debugging if needed
        chunkFileNames:  'assets/[name]-[hash].js',
        entryFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',

        // Split PixiJS into its own vendor chunk for better browser caching
        manualChunks: {
          pixi: ['pixi.js'],
        },
      },
    },

    // Warn if any single chunk exceeds 1 MB (PixiJS is ~700 KB minified)
    chunkSizeWarningLimit: 1200,

    // Compress images — but we have none (all drawn procedurally), so this
    // is a no-op, confirming zero external asset dependencies
    assetsInlineLimit: 4096,
  },

  // Ensure Vite resolves pixi.js correctly in ESM mode
  optimizeDeps: {
    include: ['pixi.js'],
  },
});
