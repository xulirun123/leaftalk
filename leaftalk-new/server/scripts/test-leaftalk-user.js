const mysql = require('mysql2/promise')
;(async () => {
  try {
    const conn = await mysql.createConnection({ host: 'localhost', user: 'leaftalk', password: 'password', database: 'leaftalk-new' })
    const [rows] = await conn.execute('SELECT 1 AS ok')
    console.log('connect ok', rows)
    await conn.end()
  } catch (e) {
    console.error('connect failed', e.message)
    process.exit(1)
  }
})()

