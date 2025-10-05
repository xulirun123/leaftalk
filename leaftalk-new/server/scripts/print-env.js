const dotenv = require('dotenv')
const path = require('path')
let r1 = dotenv.config({ path: path.resolve(__dirname, '.env'), override: true })
if (r1.error) {
  let r2 = dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true })
  console.log('root .env load result:', r2.error ? r2.error.message : 'ok')
} else {
  console.log('server .env load result:', 'ok')
}
const fs = require('fs')
const pRoot = path.resolve(__dirname, '..', '.env')
console.log('Read root .env path:', pRoot)
try { console.log('Root .env content (first 5 lines):\n' + fs.readFileSync(pRoot, 'utf8').split(/\r?\n/).slice(0,5).join('\n')) } catch(e) { console.log('Read root .env error:', e.message) }
console.log('DB_USER=', process.env.DB_USER)
console.log('DB_PASSWORD set? ', !!process.env.DB_PASSWORD)
console.log('DB_NAME=', process.env.DB_NAME)

