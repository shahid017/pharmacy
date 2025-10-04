# Deployment Guide for Render

This guide helps you deploy the Prescription OCR app to Render.

## Render Deployment Steps

### 1. Environment Variables
Set these environment variables in your Render dashboard:

```bash
# Google Vision API Configuration
GOOGLE_VISION_API_KEY=your_google_vision_api_key_here
GOOGLE_PROJECT_ID=your_google_project_id_here

# Google Gemini API Configuration (Required for AI extraction)
GEMINI_KEY=your_gemini_api_key_here

# OCR Provider Selection
OCR_PROVIDER=google
```

### 2. Build Settings
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Node.js Version**: 18 (specified in .nvmrc)

### 3. Render Configuration
- **Framework**: Next.js
- **Node.js Version**: 18
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: Production

### 4. API Keys Setup
Make sure to get your API keys from:

#### Google Vision API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Vision API
3. Create API credentials
4. Copy the API key

#### Google Gemini API
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Copy the API key

### 5. Common Issues & Solutions

#### Issue: "Cannot install with frozen-lockfile"
**Solution**: The `package-lock.json` is now included in the repository to fix this.

#### Issue: "next: not found"
**Solution**: Make sure the build command is `npm install && npm run build`.

#### Issue: Environment variables not loading
**Solution**: Ensure all environment variables are set in Render dashboard under "Environment".

### 6. Build Process
The deployment process:
1. Render clones your repository
2. Installs dependencies with `npm install`
3. Builds the app with `npm run build`
4. Starts the app with `npm start`

### 7. Health Check
The app will be available at your Render URL. Test the deployment by:
1. Visiting the homepage
2. Uploading a test prescription image
3. Verifying OCR and AI extraction work

## Troubleshooting

If deployment fails:
1. Check the build logs in Render dashboard
2. Verify all environment variables are set
3. Ensure API keys are valid and have proper permissions
4. Check that the Node.js version matches (18)

## Production Considerations

- **API Rate Limits**: Monitor your Google Vision and Gemini API usage
- **Error Handling**: The app has fallback mechanisms if APIs fail
- **Security**: Never commit API keys to the repository
- **Performance**: The app uses Gemini 2.0 Flash for fast AI processing
