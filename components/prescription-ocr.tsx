"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileImage, Loader2 } from "lucide-react"
import { extractPrescription } from "@/app/actions/extract-prescription"

interface ExtractionResult {
  rawText: string
  normalizedText: string
  adminTimes: string[]
}

export function PrescriptionOCR() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile)
      setError(null)
      setResult(null)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setError("Please select a valid image file")
    }
  }

  const handleExtract = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const result = await extractPrescription(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setResult(result.data)
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Prescription</CardTitle>
          <CardDescription>
            Upload a prescription image (.png, .jpg, .jpeg) to extract medication instructions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 hover:border-primary/50 transition-colors">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
              {preview ? (
                <div className="space-y-3 text-center">
                  <img
                    src={preview || "/placeholder.svg"}
                    alt="Prescription preview"
                    className="max-h-48 rounded-md border border-border"
                  />
                  <p className="text-sm text-muted-foreground">{file?.name}</p>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">Click to upload prescription image</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                </>
              )}
            </label>
          </div>

          {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">{error}</div>}

          <Button onClick={handleExtract} disabled={!file || loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <FileImage className="mr-2 h-4 w-4" />
                Extract & Normalize
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Raw Extracted Text</CardTitle>
              <CardDescription>Original text extracted from the prescription image</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md font-mono text-sm whitespace-pre-wrap">
                {result.rawText || "No text extracted"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Normalized Instructions</CardTitle>
              <CardDescription>Medical abbreviations converted to readable format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md font-mono text-sm whitespace-pre-wrap">
                {result.normalizedText || "No normalized text available"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Administration Times</CardTitle>
              <CardDescription>Identified medication administration times</CardDescription>
            </CardHeader>
            <CardContent>
              {result.adminTimes.length > 0 ? (
                <ul className="space-y-2">
                  {result.adminTimes.map((time, index) => (
                    <li key={index} className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-md">
                      <span className="font-medium">{time}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">No administration times detected</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
