"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading"

interface PaystackButtonProps {
  amount: number
  email: string
  name: string
  onSuccess: (reference: string) => void
  onClose: () => void
  disabled?: boolean
  onOpen?: () => void
  isLoading?: boolean
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: {
        key: string
        email: string
        amount: number
        currency: string
        ref: string
        metadata: {
          custom_fields: Array<{
            display_name: string
            variable_name: string
            value: string
          }>
        }
        onClose: () => void
        callback: (response: { reference: string }) => void
      }) => {
        openIframe: () => void
      }
    }
  }
}

export function PaystackButton({
  amount,
  email,
  name,
  onSuccess,
  onClose,
  disabled = false,
  onOpen,
  isLoading = false,
}: PaystackButtonProps) {
  const scriptLoadedRef = useRef(false)

  useEffect(() => {
    if (!scriptLoadedRef.current) {
      const script = document.createElement("script")
      script.src = "https://js.paystack.co/v1/inline.js"
      script.async = true
      document.body.appendChild(script)
      scriptLoadedRef.current = true

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      }
    }
  }, [])

  const handlePayment = () => {
    if (!window.PaystackPop) {
      console.error("Paystack script not loaded")
      return
    }

    if (onOpen) {
      onOpen()
    }

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
      email,
      amount,
      currency: "NGN",
      ref: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
      metadata: {
        custom_fields: [
          {
            display_name: "Customer Name",
            variable_name: "customer_name",
            value: name,
          },
        ],
      },
      onClose,
      callback: (response) => {
        onSuccess(response.reference)
      },
    })

    handler.openIframe()
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      size="lg"
      className="bg-gradient-to-r from-[#0052CC] to-[#00A3E0] hover:from-[#0052CC]/90 hover:to-[#00A3E0]/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
    >
      {isLoading ? (
        <>
          <LoadingSpinner  />
          Initializing Payment...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Pay ₦{(amount / 100).toLocaleString()}
        </>
      )}
    </Button>
  )
}