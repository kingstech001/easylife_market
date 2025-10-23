"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface PaystackButtonProps {
  amount: number // amount in kobo (smallest currency unit)
  email: string
  name?: string
  onSuccess?: (reference: string) => void
  onClose?: () => void
  onOpen?: () => void
  disabled?: boolean
}

export function PaystackButton({ amount, email, name, onSuccess, onClose, onOpen, disabled }: PaystackButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    if (scriptLoaded) return

    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    script.async = true
    script.onload = () => setScriptLoaded(true)
    script.onerror = () => console.error("Failed to load Paystack script")
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [scriptLoaded])

  const generateReference = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const handlePayment = () => {
    if (!scriptLoaded) {
      console.error("Paystack script not loaded")
      return
    }

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    if (!publicKey) {
      console.error("Paystack public key not configured")
      return
    }

    setIsLoading(true)
    onOpen?.()

    const ref = generateReference()
    console.debug("Opening Paystack with ref:", ref, "amount(kobo):", amount)

    const handler = (window as any).PaystackPop.setup({
      key: publicKey,
      email,
      // amount is already provided in kobo by the caller — do NOT multiply here
      amount,
      ref,
      metadata: { custom_fields: [{ display_name: "Customer Name", variable_name: "name", value: name || "" }] },
      callback: (response: any) => {
        setIsLoading(false)
        console.debug("Paystack callback response:", response)
        onSuccess?.(response.reference)
      },
      onClose: () => {
        setIsLoading(false)
        onClose?.()
      },
    })

    try {
      handler.openIframe()
    } catch (err) {
      setIsLoading(false)
      console.error("Failed to open Paystack iframe", err)
    }
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading || !scriptLoaded || disabled}
      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:bg-gray-400 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
      size="lg"
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Spinner className="size-4" />
          <span>Processing</span>
        </div>
      ) : scriptLoaded ? (
        "Pay Now"
      ) : (
        "Loading..."
      )}
    </Button>
  )
}
