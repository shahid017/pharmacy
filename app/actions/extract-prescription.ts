"use server"

import { generateText } from "ai"

// Normalization mappings
const NORMALIZATION_MAP: Record<string, string> = {
  qhs: "at bedtime",
  od: "once daily",
  bid: "twice daily",
  tid: "three times daily",
  qid: "four times daily",
  prn: "as needed",
  tab: "tablet",
  tabs: "tablets",
  cap: "capsule",
  caps: "capsules",
  po: "by mouth",
  qam: "every morning",
  qpm: "every evening",
  ac: "before meals",
  pc: "after meals",
  hs: "at bedtime",
  qd: "once daily",
  mg: "milligrams",
  ml: "milliliters",
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

  // Replace abbreviations (case insensitive)
  Object.entries(NORMALIZATION_MAP).forEach(([abbrev, full]) => {
    const regex = new RegExp(`\\b${abbrev}\\b`, "gi")
    normalized = normalized.replace(regex, full)
  })

  return normalized
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

export async function extractPrescription(formData: FormData) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      return { error: "No file provided" }
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const mimeType = file.type

    console.log("[v0] Starting OCR extraction with OpenAI Vision")

    // Use OpenAI Vision to extract text
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

    console.log("[v0] Raw extracted text:", rawText)

    // Normalize the text
    const normalizedText = normalizeText(rawText)
    console.log("[v0] Normalized text:", normalizedText)

    // Extract admin times
    const adminTimes = extractAdminTimes(normalizedText)
    console.log("[v0] Admin times found:", adminTimes)

    return {
      data: {
        rawText,
        normalizedText,
        adminTimes,
      },
    }
  } catch (error) {
    console.error("[v0] Error extracting prescription:", error)
    return {
      error: "Failed to extract prescription. Please try again.",
    }
  }
}
