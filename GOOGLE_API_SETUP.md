# Google Timezone API Setup

To enable accurate timezone detection for your schedule management system, follow these steps:

## 1. Get Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - **Geocoding API** (to convert "Birmingham, AL, USA" to coordinates)
   - **Time Zone API** (to get timezone from coordinates)

4. Create credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key

## 2. Configure API Key

Add your Google API key to your environment file:

**Frontend (.env file):**
```bash
# Create or update: timebuddyv1/frontend/.env
VITE_GOOGLE_API_KEY=your_google_api_key_here
```

**Example:**
```bash
VITE_GOOGLE_API_KEY=AIzaSyBq12345abcdef-YourActualAPIKey
```

## 3. Restart Frontend

After adding the API key, restart your frontend server:
```bash
cd timebuddyv1/frontend
npm run dev
```

## 4. Test the Integration

1. Open your schedule management
2. Select a business 
3. Check browser console - you should see logs like:
   ```
   Geocoded "Birmingham, AL, USA" to: 33.5207, -86.8025
   Location "Birmingham, AL, USA" is in timezone: America/Chicago
   Using Google Timezone API result: 2025-09-14
   ```

## 5. API Usage & Billing

- **Free Tier**: 40,000 requests/month for Geocoding API
- **Free Tier**: 100,000 requests/month for Time Zone API
- **Cost**: Very low for typical usage (few cents per month)

## 6. Fallback Behavior

If Google API is not configured or fails:
- System falls back to hardcoded state mappings
- Alabama will still work (now correctly set to Central Time)
- Console will show: `"Google API failed, falling back to hardcoded mapping"`

## Benefits of Google API

✅ **Accurate**: Works for any location worldwide  
✅ **Dynamic**: Handles complex timezone cases  
✅ **Future-proof**: Automatically updated timezone rules  
✅ **Smart**: Caches results to minimize API calls  

## Current Status

- **✅ Alabama fixed**: Now correctly mapped to Central Time  
- **✅ Backend fixed**: Accepts Sunday-based weeks  
- **🆕 Google API**: Optional upgrade for better accuracy  

Your schedule system works with or without the Google API!
