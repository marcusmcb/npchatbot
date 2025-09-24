const http = require('http')
const { waitForServer } = require('../../scripts/waitForServer')

describe('waitForServer', () => {
  test('resolves when server is ready', async () => {
    const server = http.createServer((_, res) => res.end('ok'))
    await new Promise((resolve) => server.listen(0, resolve))
    const { port } = server.address()
    const ok = await waitForServer(`http://127.0.0.1:${port}`, 2000)
    server.close()
    expect(ok).toBe(true)
  })

  test('times out when server is not ready', async () => {
    const ok = await waitForServer('http://127.0.0.1:65500', 500)
    expect(ok).toBe(false)
  })
})
