#!/usr/bin/env node

/**
 * Generate VAPID keys for Web Push Notifications
 *
 * Usage: node scripts/generate-vapid-keys.js
 *
 * This will output VAPID keys that you can add to your .env.local file
 */

const webpush = require('web-push')

console.log('\n🔑 Generating VAPID keys for Web Push Notifications...\n')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('✅ Keys generated successfully!')
console.log('\nAdd these to your .env.local file:\n')
console.log('# Push Notifications')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`)
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`)
console.log(`VAPID_SUBJECT="mailto:your-email@example.com"`)
console.log('\n⚠️  Keep the private key secret and never commit it to version control!\n')
