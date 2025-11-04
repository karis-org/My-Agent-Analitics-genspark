import { defineConfig } from 'vite'
import pages from '@hono/vite-cloudflare-pages'

export default defineConfig({
  plugins: [pages()],
  build: {
    outDir: 'dist',
    // パフォーマンス最適化設定
    minify: 'terser', // Terserを使用した高度な圧縮
    terserOptions: {
      compress: {
        drop_console: true, // 本番環境ではconsole.logを削除
        drop_debugger: true, // debuggerステートメントを削除
        pure_funcs: ['console.info', 'console.debug', 'console.warn'], // 特定のconsole関数を削除
        passes: 2 // 複数パスで圧縮を強化
      },
      mangle: {
        safari10: true // Safari 10+の互換性を保持
      },
      format: {
        comments: false // コメントを削除
      }
    },
    rollupOptions: {
      // Tree-shaking最適化
      treeshake: {
        moduleSideEffects: 'no-external',
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      }
    },
    // チャンクサイズ警告のしきい値
    chunkSizeWarningLimit: 600, // 600KB（Cloudflare Workersの制限を考慮）
    // ソースマップ（本番環境では無効化してサイズ削減）
    sourcemap: false,
    // CSSコード分割を有効化
    cssCodeSplit: true,
    // アセット最適化
    assetsInlineLimit: 4096 // 4KB以下の画像をインライン化
  },
  // エイリアス設定（パスの最適化）
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
