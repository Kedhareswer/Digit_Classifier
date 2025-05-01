import DigitRecognizer from "@/components/digit-recognizer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Info } from "lucide-react"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-4 md:p-24">
      <div className="z-10 max-w-5xl w-full flex flex-col items-center justify-center font-mono text-base">
        <div className="flex flex-col md:flex-row justify-between items-center w-full mb-10 gap-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-center md:text-left text-zinc-100 drop-shadow-lg">Digit Recognition</h1>
          <Link href="/model-info">
            <Button variant="outline" size="sm" className="flex items-center gap-2 bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800">
              <Info className="h-4 w-4" />
              <span>Model Info</span>
            </Button>
          </Link>
        </div>
        <p className="text-center mb-10 text-zinc-400 text-lg font-normal">Draw one or more digits (0-9) in the canvas below and see the predictions</p>
        <DigitRecognizer />
      </div>
    </main>
  )
}
