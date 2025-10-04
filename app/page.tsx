import { PrescriptionOCR } from "@/components/prescription-ocr"

export default function Home() {
  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3 text-balance">Prescription OCR & Normalizer</h1>
          <p className="text-muted-foreground text-lg">
            Extract and normalize medication instructions from prescription images
          </p>
        </div>
        <PrescriptionOCR />
      </div>
    </main>
  )
}
