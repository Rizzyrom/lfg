# 📱 LFG PWA Installation Guide

Your LFG app is now a Progressive Web App (PWA) that can be installed on phones!

## 🚀 Deploy to Vercel

1. **Push latest changes to GitHub** (already done!)
   ```bash
   git status
   # Should show clean working tree
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your `lfg` repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

3. **Get your production URL**
   - Example: `https://lfg-yourname.vercel.app`
   - Share this URL with your friend

## 📲 Install on iPhone (iOS)

1. **Open Safari** (must use Safari, not Chrome)
2. **Go to your Vercel URL**: `https://lfg-yourname.vercel.app`
3. **Login** with username `ROM` or `TOM` (password: `test123`)
4. **Tap the Share button** (square with arrow pointing up)
5. **Scroll down** and tap "Add to Home Screen"
6. **Tap "Add"** in the top right
7. **Done!** The LFG icon will appear on your home screen

### iOS Features:
- ✅ Full-screen app (no Safari UI)
- ✅ Works offline (cached pages)
- ✅ Looks like a native app
- ✅ Upward chart icon on home screen

## 📲 Install on Android

1. **Open Chrome** (or any browser)
2. **Go to your Vercel URL**: `https://lfg-yourname.vercel.app`
3. **Login** with username `ROM` or `TOM` (password: `test123`)
4. **Tap the menu** (three dots in top right)
5. **Tap "Install app"** or "Add to Home screen"
6. **Tap "Install"**
7. **Done!** The LFG icon will appear on your home screen

### Android Features:
- ✅ Full-screen app (no browser UI)
- ✅ Works offline (cached pages)
- ✅ Looks like a native app
- ✅ Upward chart icon on home screen
- ✅ Shows in app drawer like other apps

## 🎯 What Works on Mobile

### All Features Accessible:
- ✅ **Top Gainers/Losers** - Tap chart icon in top bar (left)
- ✅ **AI Pulse** - Tap lightbulb icon in top bar (right)
- ✅ **News Feed** - Optimized cards with full-width images
- ✅ **Watchlist** - Add symbols, view prices, AI analysis
- ✅ **Chat** - Real-time group chat
- ✅ **Mobile Navigation** - Bottom nav bar with Feed/Watch/Chat

### Mobile Optimizations:
- 📱 Responsive layouts for all screen sizes
- 🖼️ Full-width images on mobile
- 📊 Drawer-based sidebars (swipe or tap icons)
- 💬 Touch-friendly buttons (44x44px minimum)
- 🔄 Pull-to-refresh on feed pages
- ⚡ Fast loading with service worker caching

## 🧪 Test Checklist

Once installed on your phone, test these features:

- [ ] Login with ROM or TOM account
- [ ] View market news feed
- [ ] Tap chart icon to see Top Gainers/Losers
- [ ] Tap lightbulb icon to see AI Pulse
- [ ] Add a crypto symbol (BTC, ETH, etc.)
- [ ] Add a stock symbol (AAPL, TSLA, etc.)
- [ ] Click a watchlist item to see AI analysis
- [ ] Send a message in group chat
- [ ] Navigate between Feed/Watchlist/Chat tabs
- [ ] Turn off wifi - app should still load cached pages
- [ ] Turn wifi back on - data refreshes

## 🐛 Troubleshooting

### "Install" option not showing?
- **iOS**: Must use Safari browser
- **Android**: Try Chrome or Edge
- Make sure you're on HTTPS (Vercel provides this automatically)

### App not updating?
- Close the app completely
- Reopen it
- Service worker will fetch latest version

### Cache issues?
- Clear browser cache
- Uninstall and reinstall the PWA

## 📝 Current Users

- **ROM**: password `test123`
- **TOM**: password `test123`

Both users are in the same group and can chat together!

## 🎨 Customization

Want to change the app name or colors?

1. Edit `/public/manifest.json`:
   ```json
   {
     "name": "Your Custom Name",
     "theme_color": "#YourColor"
   }
   ```

2. Edit `/app/layout.tsx`:
   ```typescript
   export const metadata: Metadata = {
     title: 'Your Custom Title',
   }
   ```

3. Push changes and redeploy to Vercel

## 🚀 Next Steps

1. Share your Vercel URL with TOM
2. Both install the PWA on your phones
3. Test chatting together
4. Add your favorite stocks/crypto to watchlist
5. Enjoy real-time market data on the go!

---

**Built with**: Next.js 14, TypeScript, Tailwind CSS, Prisma, Neon Postgres
**PWA Features**: Offline support, installable, full-screen, cached assets
