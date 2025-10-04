# Prescription OCR App Setup Guide

This web app extracts and normalizes medication instructions from prescription images using OCR technology and AI-powered medication information extraction.

## Features

- **Upload Box**: Upload prescription images (PNG, JPG, JPEG)
- **OCR Extraction**: Extract text using OpenAI Vision API or Google Vision API
- **AI-Powered Analysis**: Use Google Gemini 2.0 Flash AI for intelligent medication information extraction
- **Normalization**: Convert medical abbreviations to readable format (qhs → "at bedtime", od → "once daily", tab → "tablet")
- **Structured Data**: Extract medicine name, type, quantity, frequency, and taking method
- **Admin Times Detection**: Identify medication administration times
- **Results Display**: Show raw text, normalized text, structured medication details, and admin times

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# OpenAI API Configuration (Recommended)
OPENAI_API_KEY=your_openai_api_key_here

# Google Vision API Configuration (Alternative)
GOOGLE_VISION_API_KEY=your_google_vision_api_key_here
GOOGLE_PROJECT_ID=your_google_project_id_here

# Google Gemini API Configuration (Required for AI extraction)
GEMINI_KEY=your_gemini_api_key_here

# OCR Provider Selection: "openai" or "google"
OCR_PROVIDER=openai
```

### 2. Get API Keys

#### Option A: OpenAI API (Recommended)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Click "Create new secret key"
4. Copy the key and add it to your `.env.local` file
5. Make sure you have credits in your OpenAI account

#### Option B: Google Vision API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Vision API:
   - Go to "APIs & Services" > "Library"
   - Search for "Vision API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key
5. Add the API key and project ID to your `.env.local` file

#### Option C: Google Gemini API (Required for AI extraction)
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" in the left sidebar
4. Create a new API key
5. Copy the API key and add it to your `.env.local` file as `GEMINI_KEY`

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## How It Works

### Processing Pipeline
1. **Image Upload**: User uploads a prescription image
2. **OCR Text Extraction**: The app calls either OpenAI Vision API or Google Vision API to extract text
3. **AI Analysis**: Google Gemini 2.0 Flash AI analyzes the extracted text to identify medication information
4. **Structured Extraction**: Gemini extracts medicine name, type, quantity, frequency, and taking method
5. **Normalization**: Medical abbreviations are converted to readable format (qhs → "at bedtime", od → "once daily", tab → "tablet")
6. **Admin Times**: The app identifies medication administration times
7. **Fallback**: If any API fails, the app automatically tries alternative methods

### Normalization Examples
- `qhs` → `at bedtime`
- `od` → `once daily`
- `bid` → `twice daily`
- `tab` → `tablet`
- `po` → `by mouth`

### Admin Times Detection
The app identifies these administration times:
- at bedtime
- in the morning
- in the evening
- before meals
- after meals
- once daily
- twice daily
- three times daily
- four times daily

## Usage

1. **Upload Image**: Click the upload area and select a prescription image
2. **Extract & Normalize**: Click the "Extract & Normalize" button
3. **View Results**: See four sections:
   - **Raw Extracted Text**: Original text from OCR
   - **Normalized Instructions**: Abbreviations converted to readable format
   - **Medication Details**: AI-extracted structured information (name, type, quantity, frequency, taking method)
   - **Administration Times**: Detected medication times

## Troubleshooting

### Common Issues

1. **"API key not configured" error**
   - Check that your `.env.local` file exists and contains the correct API key
   - Restart the development server after adding environment variables

2. **"No text could be extracted" error**
   - Ensure the image is clear and text is readable
   - Try a different image format (PNG usually works best)
   - Check that the image contains medication instructions

3. **OCR extraction fails**
   - The app will automatically try both APIs if one fails
   - Check your API key balances and quotas
   - Ensure you have internet connectivity

### API Costs
- **OpenAI**: ~$0.01-0.02 per image (GPT-4 Vision)
- **Google Vision**: ~$0.0015 per image (first 1000 images free per month)

## Development

### File Structure
```
├── app/
│   ├── actions/
│   │   └── extract-prescription.ts  # OCR and normalization logic
│   └── page.tsx                     # Main page
├── components/
│   └── prescription-ocr.tsx         # Upload and results UI
└── .env.local                       # API keys (not in git)
```

### Adding New Normalizations
Edit the `NORMALIZATION_MAP` in `extract-prescription.ts`:

```typescript
const NORMALIZATION_MAP: Record<string, string> = {
  // Add new mappings here
  new_abbrev: "full phrase",
}
```

### Adding New Admin Times
Edit the `ADMIN_TIMES` array in `extract-prescription.ts`:

```typescript
const ADMIN_TIMES = [
  // Add new admin times here
  "new administration time",
]
```
