"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  ImageIcon,
  Loader2,
  MapPin,
  Palette,
  Save,
  Store,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BusinessHoursEditor,
  BusinessHours,
  DEFAULT_BUSINESS_HOURS,
} from "@/components/business-hours-editor";
import { MapAddressPicker } from "@/components/ui/map-address-picker";
import { cn } from "@/lib/utils";

interface StoreLocation {
  type: string;
  coordinates: [number, number];
  address: string;
  city?: string;
  state?: string;
  country?: string;
}

interface StoreData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  phone?: string;
  location?: StoreLocation | null;
  businessHours?: BusinessHours;
}

export default function StoreSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [activeTab, setActiveTab] = useState("general");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Location state
  const [locationAddress, setLocationAddress] = useState("");
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [phone, setPhone] = useState("");

  // Business hours state
  const [businessHours, setBusinessHours] = useState<BusinessHours>(
    DEFAULT_BUSINESS_HOURS
  );

  // Fetch store data
  useEffect(() => {
    const fetchStore = async () => {
      setIsFetching(true);
      try {
        const response = await fetch("/api/dashboard/seller/store");

        if (!response.ok) throw new Error("Failed to fetch store");

        const data = await response.json();
        const store: StoreData = data.store;

        setName(store.name || "");
        setSlug(store.slug || "");
        setDescription(store.description || "");
        setLogoUrl(store.logo_url || "");
        setBannerUrl(store.banner_url || "");
        setPhone(store.phone || "");
        if (store.location?.address) {
          setLocationAddress(store.location.address);
          if (store.location.coordinates && store.location.coordinates[0] !== 0 && store.location.coordinates[1] !== 0) {
            setLocationCoords({ lat: store.location.coordinates[1], lng: store.location.coordinates[0] });
          }
        }

        // Use DB hours if valid, otherwise fall back to defaults
        if (store.businessHours && isValidBusinessHours(store.businessHours)) {
          setBusinessHours(store.businessHours);
        } else {
          setBusinessHours(DEFAULT_BUSINESS_HOURS);
        }
      } catch (error) {
        console.error("Error fetching store:", error);
        toast.error("Failed to load store settings");
      } finally {
        setIsFetching(false);
      }
    };
    fetchStore();
  }, []);

  // ✅ Same validation logic as page.tsx — check if at least one day has real data
  function isValidBusinessHours(bh: any): boolean {
    if (!bh || typeof bh !== "object") return false;
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    return days.some(
      (day) =>
        bh[day] &&
        typeof bh[day].openTime === "string" &&
        bh[day].openTime.includes(":")
    );
  }

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug) {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(autoSlug);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (name.length < 3)
      newErrors.name = "Store name must be at least 3 characters.";

    if (slug.length < 3) {
      newErrors.slug = "Store slug must be at least 3 characters.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      newErrors.slug =
        "Slug can only contain lowercase letters, numbers, and hyphens.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();
      setLogoUrl(result.secure_url);
      toast.success("Logo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handle banner upload
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploadingBanner(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();
      setBannerUrl(result.secure_url);
      toast.success("Banner uploaded successfully!");
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast.error("Failed to upload banner");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Submit handler — now includes businessHours
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboard/seller/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          phone,
          locationAddress: locationAddress || undefined,
          locationCoords: locationCoords || undefined,
          businessHours,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update store");
      }

      toast.success("Store updated successfully!");
      router.push("/dashboard/seller/store");
    } catch (error: any) {
      console.error("Error updating store:", error);
      toast.error(error.message || "Failed to save changes");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#0E5A43]" />
        <span className="text-sm text-muted-foreground">
          Loading store settings...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-7 pb-10">
      {/* Page header */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-border/60 pb-4 sm:pb-5">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Store Settings
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage how your storefront appears to customers
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full sm:w-auto bg-[#0E5A43] text-white hover:bg-[#a88a36] text-white shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5 sm:space-y-6">
        <TabsList className="w-full overflow-x-auto flex sm:grid sm:grid-cols-4 h-auto p-1 bg-muted/60 rounded-xl">
          <TabsTrigger
            value="general"
            className="flex-1 gap-1.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-[#0E5A43]"
          >
            <Store className="h-3.5 w-3.5" />
            <span className="hidden xs:inline sm:inline">General</span>
            <span className="xs:hidden sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger
            value="location"
            className="flex-1 gap-1.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-[#0E5A43]"
          >
            <MapPin className="h-3.5 w-3.5" />
            Location
          </TabsTrigger>
          <TabsTrigger
            value="hours"
            className="flex-1 gap-1.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-[#0E5A43]"
          >
            <Clock className="h-3.5 w-3.5" />
            Hours
          </TabsTrigger>
          <TabsTrigger
            value="appearance"
            className="flex-1 gap-1.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-[#0E5A43]"
          >
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden xs:inline sm:inline">Appearance</span>
            <span className="xs:hidden sm:hidden">Style</span>
          </TabsTrigger>
        </TabsList>

        {/* ── General Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="general" className="space-y-4 mt-0">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="p-0 pb-5 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#0E5A43]/10 flex items-center justify-center">
                  <Store className="h-4 w-4 text-[#0E5A43]" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">General Information</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Basic information about your store
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-0 pt-5">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">
                  Store Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter store name"
                  className="h-11"
                />
                {errors.name ? (
                  <p className="text-xs text-red-500">{errors.name}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    This is the name that customers will see.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-sm font-medium">
                  Store URL
                </Label>
                <div className="flex items-stretch rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-[#0E5A43]/40 focus-within:border-[#0E5A43]/50 transition-all">
                  <span className="inline-flex items-center px-3 bg-muted/60 text-xs sm:text-sm text-muted-foreground border-r border-input whitespace-nowrap">
                    yoursite.com/store/
                  </span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="store-slug"
                    className="h-11 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                {errors.slug ? (
                  <p className="text-xs text-red-500">{errors.slug}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Lowercase letters, numbers, and hyphens only.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium">
                  Store Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell customers about your store..."
                  className="resize-none"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  A short, compelling pitch shown on your storefront.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Location Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="location" className="space-y-5 mt-0">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="p-0 pb-5 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#0E5A43]/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-[#0E5A43]" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Store Location</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Where customers find you and how delivery fees are calculated
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-0 pt-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Store Address</Label>
                <MapAddressPicker
                  value={locationAddress}
                  onChange={(address) => setLocationAddress(address)}
                  onSelect={(coords) => setLocationCoords(coords)}
                  placeholder="Tap to pick your store address on the map"
                />
                <p className="text-xs text-muted-foreground">
                  Used to calculate delivery fees for customers near your store.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Business Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Preferably WhatsApp-enabled. Admin will contact you on this number.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2 border-t border-border/60">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full sm:w-auto mt-4 bg-[#0E5A43] text-white hover:bg-[#a88a36] text-white shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Location
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* ── Business Hours Tab ──────────────────────────────────────────────── */}
        <TabsContent value="hours" className="space-y-5 mt-0">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="p-0 pb-5 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#0E5A43]/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-[#0E5A43]" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Business Hours</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Set when your store is open for orders
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-5">
              <BusinessHoursEditor
                value={businessHours}
                onChange={setBusinessHours}
                showHeading={false}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2 border-t border-border/60">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full sm:w-auto mt-4 bg-[#0E5A43] text-white hover:bg-[#a88a36] text-white shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Hours
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* ── Appearance Tab ────────────────────────────────────────────────── */}
        <TabsContent value="appearance" className="space-y-5 mt-0">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="p-0 pb-5 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#0E5A43]/10 flex items-center justify-center">
                  <Palette className="h-4 w-4 text-[#0E5A43]" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Store Images</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Brand your storefront with a logo and banner
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 sm:space-y-8 p-0 pt-5">
              {/* Logo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-semibold">Store Logo</Label>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">400×400px</span>
                </div>

                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={isUploadingLogo}
                />

                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Preview / Dropzone */}
                  <button
                    type="button"
                    onClick={() => document.getElementById("logo-upload")?.click()}
                    disabled={isUploadingLogo}
                    className={cn(
                      "relative group h-32 w-32 sm:h-36 sm:w-36 rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center transition-all flex-shrink-0",
                      logoUrl
                        ? "border-[#0E5A43]/40 bg-muted/30"
                        : "border-border/60 hover:border-[#0E5A43]/60 hover:bg-[#0E5A43]/5 bg-muted/20",
                      isUploadingLogo && "opacity-60 cursor-not-allowed",
                    )}
                  >
                    {logoUrl ? (
                      <>
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="h-6 w-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                        <ImageIcon className="h-8 w-8" />
                        <span className="text-[11px]">No logo</span>
                      </div>
                    )}

                    {isUploadingLogo && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#0E5A43]" />
                      </div>
                    )}
                  </button>

                  <div className="flex-1 space-y-2 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      A square image works best. Your logo appears in store listings, the storefront header, and on customer receipts.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("logo-upload")?.click()}
                      disabled={isUploadingLogo}
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          {logoUrl ? "Replace Logo" : "Upload Logo"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border/60" />

              {/* Banner */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-semibold">Store Banner</Label>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">1920×400px</span>
                </div>

                <input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                  disabled={isUploadingBanner}
                />

                <button
                  type="button"
                  onClick={() => document.getElementById("banner-upload")?.click()}
                  disabled={isUploadingBanner}
                  className={cn(
                    "relative group w-full aspect-[16/6] sm:aspect-[16/5] rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center transition-all",
                    bannerUrl
                      ? "border-[#0E5A43]/40 bg-muted/30"
                      : "border-border/60 hover:border-[#0E5A43]/60 hover:bg-[#0E5A43]/5 bg-muted/20",
                    isUploadingBanner && "opacity-60 cursor-not-allowed",
                  )}
                >
                  {bannerUrl ? (
                    <>
                      <img
                        src={bannerUrl}
                        alt="Banner"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex items-center gap-2 text-white text-sm font-medium">
                          <Upload className="h-5 w-5" />
                          Replace Banner
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground px-4 text-center">
                      <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10" />
                      <span className="text-xs sm:text-sm">Tap to upload a banner image</span>
                    </div>
                  )}

                  {isUploadingBanner && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="h-7 w-7 animate-spin text-[#0E5A43]" />
                    </div>
                  )}
                </button>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  A wide banner displayed at the top of your storefront. Use high-quality imagery for a premium look.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("banner-upload")?.click()}
                  disabled={isUploadingBanner}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  {isUploadingBanner ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {bannerUrl ? "Replace Banner" : "Upload Banner"}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2 border-t border-border/60">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full sm:w-auto mt-4 bg-[#0E5A43] text-white hover:bg-[#a88a36] text-white shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Appearance
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}