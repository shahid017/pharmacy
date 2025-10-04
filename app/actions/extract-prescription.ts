"use server"

import { generateText } from "ai"

// Normalization mappings - Focus on medicine name, type, quantity, and frequency
const NORMALIZATION_MAP: Record<string, string> = {
  // Frequency abbreviations
  qhs: "at bedtime",
  od: "once daily",
  bid: "twice daily",
  tid: "three times daily",
  qid: "four times daily",
  qd: "once daily",
  hs: "at bedtime",
  qam: "every morning",
  qpm: "every evening",
  
  // Medicine type abbreviations
  tab: "tablet",
  tabs: "tablets",
  cap: "capsule",
  caps: "capsules",
  
  // Administration route
  po: "by mouth",
}

// Admin times to detect
const ADMIN_TIMES = [
  "at bedtime",
  "in the morning",
  "in the evening",
  "before meals",
  "after meals",
  "every morning",
  "every evening",
  "once daily",
  "twice daily",
  "three times daily",
  "four times daily",
]

function normalizeText(text: string): string {
  let normalized = text

  // Replace abbreviations (case insensitive) with word boundaries
  Object.entries(NORMALIZATION_MAP).forEach(([abbrev, full]) => {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${abbrev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "gi")
    normalized = normalized.replace(regex, full)
  })

  // Clean up any extra spaces that might have been created
  normalized = normalized.replace(/\s+/g, " ").trim()

  return normalized
}

// Extract structured medication information using Google Gemini
async function extractMedicationInfoWithGemini(text: string): Promise<{
  medicineName: string
  medicineType: string
  quantity: string
  frequency: string
  takingMethod: string
  adminTimes: string[]
  fullText: string
}> {
  const apiKey = process.env.GEMINI_KEY
  if (!apiKey) {
    throw new Error("Gemini API key not configured. Please set GEMINI_KEY in your environment variables.")
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

  const prompt = `
You are a medical AI assistant. Extract structured medication information from the following prescription text.

Prescription text: "${text}"

Please extract and return ONLY the following information in JSON format:
{
  "medicineName": "extracted medicine name",
  "medicineType": "tablet/capsule/liquid/etc",
  "quantity": "dosage amount with units (e.g., '500 mg', '10 ml')",
  "frequency": "how often to take (e.g., 'once daily', 'twice daily', 'at bedtime')",
  "takingMethod": "how to take (e.g., 'by mouth', 'with food', 'on empty stomach')",
  "adminTimes": ["array of administration times found"],
  "fullText": "normalized version of the original text with medical abbreviations expanded"
}

Important rules:
1. Normalize medical abbreviations (qhs → "at bedtime", od → "once daily", tab → "tablet", bid → "twice daily", tid → "three times daily", qid → "four times daily", po → "by mouth")
2. If information is not clearly specified, use "Not specified"
3. Return valid JSON only, no additional text
4. For adminTimes, extract specific times like "at bedtime", "in the morning", "twice daily", etc.
5. If no clear administration times are found, use empty array []

Example output:
{
  "medicineName": "Metformin",
  "medicineType": "tablet",
  "quantity": "500 mg",
  "frequency": "at bedtime",
  "takingMethod": "by mouth",
  "adminTimes": ["at bedtime"],
  "fullText": "Metformin 500 mg tablet at bedtime"
}
`

  try {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 1024,
      }
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Gemini API error: ${response.status} ${errorData}`)
    }

    const data = await response.json()
    const jsonText = data.candidates[0].content.parts[0].text
    
    // Clean up the response to ensure it's valid JSON
    const cleanJsonText = jsonText.replace(/```json\n?|\n?```/g, '').trim()
    
    const medicationInfo = JSON.parse(cleanJsonText)
    
    return {
      medicineName: medicationInfo.medicineName || "Not specified",
      medicineType: medicationInfo.medicineType || "Not specified", 
      quantity: medicationInfo.quantity || "Not specified",
      frequency: medicationInfo.frequency || "Not specified",
      takingMethod: medicationInfo.takingMethod || "Not specified",
      adminTimes: medicationInfo.adminTimes || [],
      fullText: medicationInfo.fullText || normalizeText(text)
    }
  } catch (error) {
    console.error("Gemini API error:", error)
    // Fallback to basic normalization if Gemini fails
    const normalized = normalizeText(text)
    return {
      medicineName: "Extraction failed",
      medicineType: "Not specified",
      quantity: "Not specified", 
      frequency: "Not specified",
      takingMethod: "Not specified",
      adminTimes: extractAdminTimes(normalized),
      fullText: normalized
    }
  }
}

// Fallback function for regex-based extraction (kept as backup)
function extractMedicationInfo(text: string): {
  medicineName: string
  medicineType: string
  quantity: string
  frequency: string
  fullText: string
} {
  const normalized = normalizeText(text)
  
  // Common patterns for medication information
  const patterns = {
    // Pattern: Medicine Name + Dosage + Type + Frequency
    // e.g., "Metformin 500 mg tablet at bedtime"
    fullPattern: /^([A-Za-z\s]+?)\s+(\d+\s*(?:mg|mcg|g|ml)?)\s+(tablet|capsule|tablets|capsules|tab|cap|tabs|caps)\s+(.+)$/i,
    
    // Pattern: Medicine Name + Dosage + Frequency
    // e.g., "Metformin 500 mg at bedtime"
    dosagePattern: /^([A-Za-z\s]+?)\s+(\d+\s*(?:mg|mcg|g|ml)?)\s+(.+)$/i,
    
    // Pattern: Medicine Name + Type + Frequency
    // e.g., "Metformin tablet at bedtime"
    typePattern: /^([A-Za-z\s]+?)\s+(tablet|capsule|tablets|capsules|tab|cap|tabs|caps)\s+(.+)$/i,
  }

  let medicineName = ""
  let medicineType = ""
  let quantity = ""
  let frequency = ""

  // Try to match the full pattern first
  const fullMatch = normalized.match(patterns.fullPattern)
  if (fullMatch) {
    medicineName = fullMatch[1].trim()
    quantity = fullMatch[2].trim()
    medicineType = fullMatch[3].trim()
    frequency = fullMatch[4].trim()
  } else {
    // Try dosage pattern
    const dosageMatch = normalized.match(patterns.dosagePattern)
    if (dosageMatch) {
      medicineName = dosageMatch[1].trim()
      quantity = dosageMatch[2].trim()
      frequency = dosageMatch[3].trim()
      medicineType = "tablet" // default
    } else {
      // Try type pattern
      const typeMatch = normalized.match(patterns.typePattern)
      if (typeMatch) {
        medicineName = typeMatch[1].trim()
        medicineType = typeMatch[2].trim()
        frequency = typeMatch[3].trim()
      } else {
        // Fallback: just return the normalized text
        medicineName = normalized
        frequency = "as prescribed"
      }
    }
  }

  return {
    medicineName,
    medicineType,
    quantity,
    frequency,
    fullText: normalized
  }
}

function extractAdminTimes(text: string): string[] {
  const found = new Set<string>()
  const lowerText = text.toLowerCase()

  ADMIN_TIMES.forEach((time) => {
    if (lowerText.includes(time.toLowerCase())) {
      found.add(time)
    }
  })

  return Array.from(found)
}

// Google Vision API implementation
async function extractTextWithGoogleVision(base64: string, mimeType: string): Promise<string> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY
  const projectId = process.env.GOOGLE_PROJECT_ID

  if (!apiKey) {
    throw new Error("Google Vision API key not configured. Please set GOOGLE_VISION_API_KEY in your environment variables.")
  }

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`
  
  const requestBody = {
    requests: [
      {
        image: {
          content: base64
        },
        features: [
          {
            type: "TEXT_DETECTION",
            maxResults: 1
          }
        ]
      }
    ]
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Google Vision API error: ${response.status} ${errorData}`)
  }

  const data = await response.json()
  
  if (data.responses && data.responses[0] && data.responses[0].textAnnotations) {
    return data.responses[0].textAnnotations[0].description || ""
  }
  
  throw new Error("No text found in the image")
}

// OpenAI Vision API implementation
async function extractTextWithOpenAI(base64: string, mimeType: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error("OpenAI API key not configured. Please set OPENAI_API_KEY in your environment variables.")
  }

  try {
    const { text: rawText } = await generateText({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'Extract ONLY the medication instructions from this prescription image. Focus on medication names, dosages, and administration instructions (like "take 1 tablet by mouth twice daily"). Ignore patient information, doctor information, and other non-medication details. Return only the medication instructions as plain text.',
            },
            {
              type: "image",
              image: `data:${mimeType};base64,${base64}`,
            },
          ],
        },
      ],
    })

    return rawText
  } catch (error) {
    console.error("OpenAI API error:", error)
    throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function extractPrescription(formData: FormData) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      return { error: "No file provided" }
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return { error: "Please upload a valid image file (PNG, JPG, JPEG)" }
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const mimeType = file.type

    console.log("[OCR] Starting text extraction...")
    console.log("[OCR] File type:", mimeType)
    console.log("[OCR] File size:", file.size, "bytes")

    // Determine which OCR provider to use (prioritize Google Vision if key is available)
    const googleApiKey = process.env.GOOGLE_VISION_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY
    const ocrProvider = process.env.OCR_PROVIDER || (googleApiKey ? "google" : "openai")
    let rawText: string

    try {
      if (ocrProvider === "google") {
        console.log("[OCR] Using Google Vision API")
        rawText = await extractTextWithGoogleVision(base64, mimeType)
      } else {
        console.log("[OCR] Using OpenAI Vision API")
        rawText = await extractTextWithOpenAI(base64, mimeType)
      }
    } catch (ocrError) {
      console.error("[OCR] Primary provider failed:", ocrError)
      
      // Fallback to the other provider
      try {
        if (ocrProvider === "google") {
          console.log("[OCR] Falling back to OpenAI Vision API")
          rawText = await extractTextWithOpenAI(base64, mimeType)
        } else {
          console.log("[OCR] Falling back to Google Vision API")
          rawText = await extractTextWithGoogleVision(base64, mimeType)
        }
      } catch (fallbackError) {
        console.error("[OCR] Both providers failed:", fallbackError)
        return {
          error: `OCR extraction failed. Please check your API keys and try again. Error: ${ocrError instanceof Error ? ocrError.message : 'Unknown error'}`
        }
      }
    }

    if (!rawText || rawText.trim().length === 0) {
      return {
        error: "No text could be extracted from the image. Please ensure the image contains readable text."
      }
    }

    console.log("[OCR] Raw extracted text:", rawText)

    // Extract structured medication information using Gemini AI
    console.log("[OCR] Using Gemini AI for intelligent extraction...")
    const medicationInfo = await extractMedicationInfoWithGemini(rawText)
    console.log("[OCR] Medication info from Gemini:", medicationInfo)

    return {
      data: {
        rawText: rawText.trim(),
        normalizedText: medicationInfo.fullText,
        adminTimes: medicationInfo.adminTimes,
        medicationInfo: {
          medicineName: medicationInfo.medicineName,
          medicineType: medicationInfo.medicineType,
          quantity: medicationInfo.quantity,
          frequency: medicationInfo.frequency,
          takingMethod: medicationInfo.takingMethod,
        },
      },
    }
  } catch (error) {
    console.error("[OCR] Unexpected error:", error)
    return {
      error: "An unexpected error occurred while processing the image. Please try again.",
    }
  }
}