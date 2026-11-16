#!/usr/bin/env node
// Sets the sign-in password for Jobber.
// Writes APP_PASSWORD_HASH (and SESSION_SECRET / CRON_SECRET if missing) into .env.local.
// The password itself is never stored or printed; only its scrypt hash.
import { randomBytes, scrypt } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { stdin, stdout } from 'node:process'

function ask(question) {
  return new Promise((resolve) => {
    stdout.write(question)
    let value = ''
    stdin.setRawMode?.(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    const onData = (ch) => {
      if (ch === '\r' || ch === '\n' || ch === '\u0004') {
        stdin.setRawMode?.(false)
        stdin.pause()
        stdin.off('data', onData)
        stdout.write('\n')
        resolve(value)
      } else if (ch === '\u0003') {
        stdout.write('\n')
        process.exit(1)
      } else if (ch === '\u007f' || ch === '\b') {
        value = value.slice(0, -1)
      } else {
        value += ch
      }
    }
    stdin.on('data', onData)
  })
}

const password = await ask('New password (at least 10 characters): ')
if (password.length < 10) {
  console.error('Too short. Nothing was changed.')
  process.exit(1)
}
if ((await ask('Type it again: ')) !== password) {
  console.error('They did not match. Nothing was changed.')
  process.exit(1)
}

const salt = randomBytes(16)
const key = await new Promise((resolve, reject) =>
  scrypt(password, salt, 32, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, k) => (e ? reject(e) : resolve(k))),
)
const hash = `scrypt:${salt.toString('base64url')}:${key.toString('base64url')}`

const file = '.env.local'
let text = existsSync(file) ? readFileSync(file, 'utf8') : ''
const set = (name, value, onlyIfMissing = false) => {
  const line = new RegExp(`^${name}=.*$`, 'm')
  if (line.test(text)) {
    if (!onlyIfMissing) text = text.replace(line, `${name}=${value}`)
  } else {
    text += `${text && !text.endsWith('\n') ? '\n' : ''}${name}=${value}\n`
  }
}
set('APP_PASSWORD_HASH', hash)
set('SESSION_SECRET', randomBytes(32).toString('base64url'), true)
set('CRON_SECRET', randomBytes(32).toString('base64url'), true)
writeFileSync(file, text, { mode: 0o600 })
console.log('Saved to .env.local. Restart the app (npm run dev) and sign in.')
