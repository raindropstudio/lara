import { createApp } from './app.js'
import { createRecordedPreviewData } from './recorded-preview-data.js'
import { startServer } from './server.js'

const { store, queue, names } = await createRecordedPreviewData()
const server = await startServer(
  createApp({
    store,
    queue,
    corsOrigins: ['http://localhost:3003', 'http://127.0.0.1:3003'],
  }),
  { hostname: '127.0.0.1', port: 3002 },
)
console.info(
  '기록 응답 API: http://127.0.0.1:3002 · 캐릭터: ' + names.join(', '),
)
process.once('SIGINT', () => {
  void server.stop()
})
process.once('SIGTERM', () => {
  void server.stop()
})
