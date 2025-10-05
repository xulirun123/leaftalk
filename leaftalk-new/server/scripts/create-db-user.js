#!/usr/bin/env node
/**
 * Create MySQL user 'leaftalk'@'localhost' with password 'password',
 * create database `leaftalk-new` if not exists, and grant privileges.
 * Uses root credentials provided via env or defaults to password 'password'.
 */
const mysql = require('mysql2/promise')

const ROOT_USER = process.env.MYSQL_ROOT_USER || 'root'
const ROOT_PASSWORD = process.env.MYSQL_ROOT_PASSWORD || 'password'
const HOST = process.env.MYSQL_HOST || 'localhost'
const PORT = parseInt(process.env.MYSQL_PORT || '3306', 10)

async function main() {
  console.log('Connecting to MySQL as root...', { HOST, PORT, ROOT_USER })
  const conn = await mysql.createConnection({ host: HOST, port: PORT, user: ROOT_USER, password: ROOT_PASSWORD, multipleStatements: true })
  try {
    await conn.query("CREATE DATABASE IF NOT EXISTS `leaftalk-new` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;")
    await conn.query("CREATE USER IF NOT EXISTS 'leaftalk'@'localhost' IDENTIFIED BY 'password';")
    await conn.query("GRANT ALL PRIVILEGES ON `leaftalk-new`.* TO 'leaftalk'@'localhost';")
    await conn.query('FLUSH PRIVILEGES;')
    console.log('✅ Database and user prepared.')
  } finally {
    await conn.end()
  }
}

main().catch(err => {
  console.error('❌ Failed to prepare DB/user:', err && (err.stack || err.message || err))
  process.exit(1)
})

