import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        // forks の IPC 経由だと長い同期テスト中に onTaskUpdate がタイムアウトするので threads を使う
        // Với forks thì IPC làm onTaskUpdate hết hạn khi có test đồng bộ dài nên dùng threads
        pool: 'threads',
        include: ['test/**/*.test.ts'],
        setupFiles: ['test/setup.ts'],
        testTimeout: 180000
    }
});
