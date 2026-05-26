"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Upload } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">
          Loading store settings...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Edit Store</h2>
        <Button onClick={handleSave} disabled={isLoading}>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* ── General Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>
                Basic information about your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Store Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter store name"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  This is the name that customers will see.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Store URL</Label>
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-2">
                    yoursite.com/store/
                  </span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="store-slug"
                  />
                </div>
                {errors.slug && (
                  <p className="text-sm text-red-500">{errors.slug}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  This is the URL where customers can find your store.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Store Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell customers about your store..."
                  className="resize-none"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Location Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="location" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Store Location</CardTitle>
              <CardDescription>
                Set your store address so customers can find you and delivery fees are calculated correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Store Address</Label>
                <MapAddressPicker
                  value={locationAddress}
                  onChange={(address) => setLocationAddress(address)}
                  onSelect={(coords) => setLocationCoords(coords)}
                  placeholder="Tap to pick your store address on the map"
                />
                <p className="text-sm text-muted-foreground">
                  This address is used to calculate delivery fees for customers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Business Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                />
                <p className="text-sm text-muted-foreground">
                  Preferably WhatsApp-enabled. Admin will contact you on this number.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isLoading}>
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
        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>
                Set your opening and closing times for each day of the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessHoursEditor
                value={businessHours}
                onChange={setBusinessHours}
                showHeading={false}
              />
            </CardContent>
          </Card>

          {/* Save shortcut inside this tab */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isLoading}>
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
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Store Images</CardTitle>
              <CardDescription>
                Upload your store logo and banner
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo</Label>
                <p className="text-sm text-muted-foreground">
                  Recommended: Square image, 400x400px
                </p>
                <div className="space-y-4">
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={isUploadingLogo}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("logo-upload")?.click()
                    }
                    disabled={isUploadingLogo}
                  >
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Logo
                      </>
                    )}
                  </Button>
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="h-32 w-32 object-cover rounded-lg border"
                    />
                  )}
                </div>
              </div>

              {/* Banner */}
              <div className="space-y-2">
                <Label>Banner</Label>
                <p className="text-sm text-muted-foreground">
                  Recommended: 1920x400px
                </p>
                <div className="space-y-4">
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                    disabled={isUploadingBanner}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("banner-upload")?.click()
                    }
                    disabled={isUploadingBanner}
                  >
                    {isUploadingBanner ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Banner
                      </>
                    )}
                  </Button>
                  {bannerUrl && (
                    <img
                      src={bannerUrl}
                      alt="Banner"
                      className="h-48 w-full object-cover rounded-lg border"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}