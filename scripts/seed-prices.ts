import { PrismaClient } from '@prisma/client'
import { Decimal } from 'decimal.js'

const db = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_HGQXck0zZuW2@ep-red-cell-afq6gw1e-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    }
  }
})

const samplePrices = [
  { symbol: 'BTC', source: 'crypto', price: '67890.50', change24h: '3.24' },
  { symbol: 'ETH', source: 'crypto', price: '3456.78', change24h: '2.11' },
  { symbol: 'SOL', source: 'crypto', price: '145.32', change24h: '5.67' },
  { symbol: 'AAPL', source: 'equity', price: '178.45', change24h: '1.23' },
  { symbol: 'TSLA', source: 'equity', price: '242.18', change24h: '-2.45' },
  { symbol: 'NVDA', source: 'equity', price: '485.62', change24h: '4.12' },
  { symbol: 'AVAX', source: 'crypto', price: '28.45', change24h: '6.89' },
  { symbol: 'LINK', source: 'crypto', price: '14.23', change24h: '3.45' },
  { symbol: 'MATIC', source: 'crypto', price: '0.89', change24h: '-1.23' },
  { symbol: 'GOOGL', source: 'equity', price: '142.18', change24h: '0.87' },
]

async function main() {
  console.log('🌱 Seeding price data...\n')

  for (const item of samplePrices) {
    await db.priceCache.upsert({
      where: {
        symbol_source: {
          symbol: item.symbol,
          source: item.source,
        },
      },
      update: {
        price: new Decimal(item.price),
        change24h: new Decimal(item.change24h),
        updatedAt: new Date(),
      },
      create: {
        symbol: item.symbol,
        source: item.source,
        price: new Decimal(item.price),
        change24h: new Decimal(item.change24h),
      },
    })
    console.log(`✅ ${item.symbol} (${item.source}): $${item.price} (${item.change24h}%)`)
  }

  console.log('\n✨ Price data seeded successfully!')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
