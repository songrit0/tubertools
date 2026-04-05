# Web Support Setup Guide

This app now supports both **React Native** (Mobile) and **Web** platforms!

## 🚀 Running on Web

### Option 1: Expo Web

```bash
# Start web server
npm run web
# or
expo start --web
```

The app will open in your browser at `http://localhost:3000` (or similar).

### Option 2: Web Build

```bash
# Build for production
npm run web:build

# Or with Expo
expo export:web
```

## 📱 Responsive Design

The app automatically adapts to different screen sizes:

- **Mobile (< 768px)**: 2-3 columns grid
- **Tablet (768px - 1024px)**: 3-4 columns grid
- **Desktop (> 1024px)**: 4-6 columns grid

## 🎯 Features Working on Web

✅ SELECT GAME - 12 games grid with responsive columns
✅ WHO ARE YOU? - Character selection with responsive layout
✅ SELECT VTUBER - VTuber selection with responsive grid
✅ RESULT - Result page with centered content
✅ ADMIN LOG - Selection logs viewer with responsive table

## 🔧 Responsive Utilities

### useResponsive Hook

```javascript
import { useResponsive } from '../hooks/useResponsive';

const Component = () => {
  const responsive = useResponsive();

  return (
    <FlatList
      numColumns={responsive.isTablet ? 4 : 2}
      // ... other props
    />
  );
};
```

### Available Properties

- `width` - Window width
- `height` - Window height
- `isWeb` - True if running on web
- `isMobile` - True if mobile size (width < 600)
- `isTablet` - True if tablet size
- `isCompact` - True if width < 600

## 🎨 Web Styles

Use the web utilities for consistent styling:

```javascript
import { responsivePadding, responsiveFontSize, BREAKPOINTS } from '../theme/webStyles';

const padding = responsivePadding(width);
const fontSize = responsiveFontSize(width, 16);
```

## 💾 Database Support

Both platforms use the same Firebase Realtime Database:

- ✅ Sync VTuber data
- ✅ Save selection logs
- ✅ View admin logs

## 🌐 Browser Compatibility

- Chrome/Edge ✅
- Firefox ✅
- Safari ✅
- Mobile browsers ✅

## 📦 Production Build

```bash
# Build for Firebase Hosting
expo export:web
firebase deploy
```

The app is configured for Firebase Hosting with:
- `buildDir: dist` - Output directory
- Web configuration in `app.json`

## 🔌 Environment Variables

Create `.env` file if needed for environment-specific settings:

```
REACT_APP_API_URL=https://your-api.com
```

## 🐛 Troubleshooting

### Metro/Webpack Issues
```bash
# Clear cache
expo start --web --clear
```

### Firebase Issues
- Check Firebase Realtime Database rules are set to allow read/write
- Verify Firebase config in `firebaseConfig.js`

### Layout Issues
- Open DevTools to test responsive behavior
- Check `useResponsive` hook values
- Adjust BREAKPOINTS in `theme/webStyles.js`

## 📚 Additional Resources

- [Expo Web Documentation](https://docs.expo.dev/guides/web/)
- [React Native Web](https://necolas.github.io/react-native-web/)
- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
