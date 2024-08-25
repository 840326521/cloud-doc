import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron';
import { builtinModules } from 'module'
// import electronRenderer from 'vite-plugin-electron/renderer';
// import polyfillExports from 'vite-plugin-electron/polyfill-exports';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    outDir: '../../dist/renderer',
    // lib: {
    //   entry: 'index.ts',   // Electron 目前只支持 CommonJs 格式
    //   formats: ['cjs'],
    //   fileName: () => '[name].cjs',
    // },
    assetsDir: '',         // 这个要格外小心，使用默认的 assets 会导致在 Electron 打包后基于 file:// 加载文件失败
    rollupOptions: {
      output: {
        format: 'cjs',     // Electron 目前只支持 CommonJs 格式
      },
      external: [          // 告诉 Rollup 不要打包内建 API
        'electron',
        ...builtinModules,
      ],
    },
  },
  optimizeDeps: {
    exclude: ['electron'], // 告诉 Vite 排除预构建 electron，不然会出现 __diranme is not defined
  },
})
