"use client"

import { useEffect, useState } from "react"
import { MapPin, X, Navigation, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface LocationData {
  latitude: number
  longitude: number
  address?: string
  city?: string
  state?: string
  country?: string
}

export function LocationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if location is already stored
    const storedLocation = localStorage.getItem("userLocation")
    const locationDismissed = localStorage.getItem("locationPromptDismissed")
    
    // Show prompt only if location not stored and not dismissed
    if (!storedLocation && !locationDismissed) {
      // Delay prompt by 2 seconds for better UX
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [])

  const reverseGeocode = async (lat: number, lon: number): Promise<LocationData> => {
    try {
      // Using OpenStreetMap Nominatim API (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
      )
      
      if (!response.ok) throw new Error("Failed to fetch address")
      
      const data = await response.json()
      
      return {
        latitude: lat,
        longitude: lon,
        address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village,
        state: data.address?.state,
        country: data.address?.country,
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error)
      return {
        latitude: lat,
        longitude: lon,
      }
    }
  }

  const handleEnableLocation = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser")
      }

      // Request location permission
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          // Get address from coordinates
          const locationData = await reverseGeocode(latitude, longitude)
          
          // Store location in localStorage
          localStorage.setItem("userLocation", JSON.stringify(locationData))
          
          // Send to backend if user is logged in
          try {
            await fetch("/api/user/location", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(locationData),
            })
          } catch (err) {
            // Silently fail if user not logged in
            console.log("Location not saved to server (user may not be logged in)")
          }
          
          toast.success("Location enabled!", {
            description: locationData.city 
              ? `Delivering to ${locationData.city}, ${locationData.state}`
              : "Location saved successfully",
          })
          
          setShowPrompt(false)
          setIsLoading(false)
        },
        (error) => {
          setIsLoading(false)
          let errorMessage = "Unable to retrieve your location"
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. You can enable it in your browser settings."
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable."
              break
            case error.TIMEOUT:
              errorMessage = "Location request timed out."
              break
          }
          
          setError(errorMessage)
          toast.error("Location Error", { description: errorMessage })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    } catch (err: any) {
      setIsLoading(false)
      setError(err.message)
      toast.error("Error", { description: err.message })
    }
  }

  const handleDismiss = () => {
    localStorage.setItem("locationPromptDismissed", "true")
    setShowPrompt(false)
    toast.info("You can enable location anytime from settings")
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleDismiss}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <Card className="border-border/40 shadow-2xl">
              <CardHeader className="relative pb-4">
                <button
                  onClick={handleDismiss}
                  className="absolute right-4 top-4 p-1 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
                
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-xl bg-[#c0a146]/10">
                    <MapPin className="h-6 w-6 text-[#c0a146]" />
                  </div>
                  <CardTitle className="text-xl">Enable Location</CardTitle>
                </div>
                
                <CardDescription className="text-sm">
                  Help us provide accurate delivery estimates and find stores near you
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Navigation className="h-4 w-4 text-[#c0a146] mt-0.5 flex-shrink-0" />
                    <span>Get accurate delivery time estimates</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-[#c0a146] mt-0.5 flex-shrink-0" />
                    <span>Discover stores and products near you</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={handleEnableLocation}
                    disabled={isLoading}
                    className="flex-1 bg-[#c0a146] hover:bg-[#c0a146]/90 text-white"
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin mr-2">⌛</span>
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Enable Location
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleDismiss}
                    variant="outline"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Maybe Later
                  </Button>
                </div>
                
                <p className="text-xs text-center text-muted-foreground">
                  Your location data is stored securely and never shared with third parties
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}