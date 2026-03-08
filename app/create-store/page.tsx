"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  StoreIcon,
  Building2,
  ImageIcon,
  Upload,
  Check,
  RotateCcw,
  MapPin,
  Link2,
  FileText,
  Sparkles,
  Tag,
  X,
  Phone,
  ChevronRight,
  ChevronLeft,
  User,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { slugify, cn } from "@/lib/utils";
import { AnimatedContainer } from "@/components/ui/animated-container";
import {
  BusinessHoursEditor,
  BusinessHours,
  DEFAULT_BUSINESS_HOURS,
} from "@/components/business-hours-editor";

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

const storeFormSchema = z.object({
  // Step 1
  name: z
    .string()
    .min(3, { message: "Store name must be at least 3 characters." }),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens.",
    }),
  description: z.string().optional(),
  categories: z.string().optional(),

  // Step 2
  location: z.string().min(5, { message: "Please provide a valid address." }),
  phone: z.string().min(7).optional().or(z.literal("")),

  // Step 3
  logo_url: z.string().optional(),
  banner_url: z.string().optional(),
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Storage keys
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "create_store_draft";
const PREVIEW_STORAGE_KEY = "create_store_previews";
const HOURS_STORAGE_KEY = "create_store_hours";

// ─────────────────────────────────────────────────────────────────────────────
// Step config
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 1,
    title: "Store Identity",
    subtitle: "Name, URL & description",
    icon: Building2,
    fields: ["name", "slug", "description", "categories"] as const,
  },
  {
    id: 2,
    title: "Contact & Hours",
    subtitle: "Location, phone & schedule",
    icon: User,
    fields: ["location", "phone"] as const,
  },
  {
    id: 3,
    title: "Visual Identity",
    subtitle: "Logo & banner required",
    icon: ImageIcon,
    fields: ["logo_url", "banner_url"] as const,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CreateStorePage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours>(
    DEFAULT_BUSINESS_HOURS,
  );

  // Tracks whether the seller tried to submit without uploading
  const [logoError,   setLogoError]   = useState(false);
  const [bannerError, setBannerError] = useState(false);

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      categories: "",
      location: "",
      phone: "",
      logo_url: "",
      banner_url: "",
    },
    mode: "onChange",
  });

  // ── Load draft ──────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      const savedPreviews = localStorage.getItem(PREVIEW_STORAGE_KEY);
      const savedHours = localStorage.getItem(HOURS_STORAGE_KEY);
      if (savedDraft) {
        const d = JSON.parse(savedDraft);
        Object.keys(d).forEach((k) =>
          form.setValue(k as keyof StoreFormValues, d[k]),
        );
        setHasDraft(true);
      }
      if (savedPreviews) {
        const p = JSON.parse(savedPreviews);
        if (p.logo)   { setLogoPreview(p.logo);     setLogoError(false);   }
        if (p.banner) { setBannerPreview(p.banner);  setBannerError(false); }
      }
      if (savedHours) setBusinessHours(JSON.parse(savedHours));
    } catch {}
  }, [form]);

  // ── Auto-save form ──────────────────────────────────────────────────────────
  useEffect(() => {
    const sub = form.watch((values) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
        localStorage.setItem(
          PREVIEW_STORAGE_KEY,
          JSON.stringify({ logo: logoPreview, banner: bannerPreview }),
        );
      } catch {}
    });
    return () => sub.unsubscribe();
  }, [form, logoPreview, bannerPreview]);

  // ── Auto-save hours ─────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(HOURS_STORAGE_KEY, JSON.stringify(businessHours));
    } catch {}
  }, [businessHours]);

  // ── Auto-slug ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const sub = form.watch((value, { name }) => {
      if (name === "name" && value.name && !form.formState.dirtyFields.slug)
        form.setValue("slug", slugify(value.name), { shouldValidate: true });
    });
    return () => sub.unsubscribe();
  }, [form]);

  // ── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data = await res.json();
        if (res.ok && data?.user?._id) setOwnerId(data.user._id);
        else {
          toast.error("Authentication required");
          router.push("/auth/login");
        }
      } catch {
        toast.error("Failed to fetch user data");
      }
    })();
  }, [router]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const clearDraft = () => {
    try {
      [STORAGE_KEY, PREVIEW_STORAGE_KEY, HOURS_STORAGE_KEY].forEach((k) =>
        localStorage.removeItem(k),
      );
      form.reset();
      setLogoPreview(null);
      setBannerPreview(null);
      setBusinessHours(DEFAULT_BUSINESS_HOURS);
      setHasDraft(false);
      setCurrentStep(1);
      setCompletedSteps([]);
      setLogoError(false);
      setBannerError(false);
      toast.success("Draft cleared");
    } catch {}
  };

  const validateStep = (step: number) =>
    form.trigger(STEPS[step - 1].fields as any);

  const handleNext = async () => {
    if (!(await validateStep(currentStep))) return;
    setCompletedSteps((p) => [...new Set([...p, currentStep])]);
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStepClick = async (id: number) => {
    if (id < currentStep) setCurrentStep(id);
    else if (id === currentStep + 1) await handleNext();
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (v: string) => void,
    setError: (v: boolean) => void,
    formField: "logo_url" | "banner_url",
    label: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${label} must be less than 5MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const r = ev.target?.result as string;
      setPreview(r);
      setError(false); // clear error once a file is chosen
      form.setValue(formField, "uploaded", { shouldDirty: true });
      toast.success(`${label} uploaded`);
    };
    reader.readAsDataURL(file);
    // allow re-selecting the same file
    e.target.value = "";
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function onSubmit(data: StoreFormValues) {
    if (!ownerId) {
      toast.error("Authentication required");
      return;
    }

    // ── Guard: both logo and banner must be uploaded ─────────────────────────
    const missingLogo   = !logoPreview;
    const missingBanner = !bannerPreview;

    if (missingLogo)   setLogoError(true);
    if (missingBanner) setBannerError(true);

    if (missingLogo || missingBanner) {
      // Take seller to step 3 so they can see exactly what's missing
      if (currentStep !== 3) setCurrentStep(3);
      toast.error(
        missingLogo && missingBanner
          ? "Please upload a logo and banner before launching."
          : missingLogo
          ? "Please upload your store logo before launching."
          : "Please upload your store banner before launching.",
        { description: "They help customers recognise your brand." },
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!(await validateStep(currentStep))) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/seller/store/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          logo_url: logoPreview,
          banner_url: bannerPreview,
          categories: data.categories
            ? data.categories
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean)
            : [],
          businessHours,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error("Failed to create store", { description: result.message });
        return;
      }
      [STORAGE_KEY, PREVIEW_STORAGE_KEY, HOURS_STORAGE_KEY].forEach((k) =>
        localStorage.removeItem(k),
      );
      toast.success("Store created!", {
        description: "Your store is now live.",
      });
      router.push("/store-builder");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLastStep = currentStep === STEPS.length;
  // Launch button is visually dimmed until both images are ready
  const readyToLaunch = !!logoPreview && !!bannerPreview;

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-6 sm:py-10 px-3 sm:px-4 lg:px-8">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#c0a146]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-[#c0a146]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <AnimatedContainer animation="fadeIn" className="mb-8 p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-[#c0a146] to-[#d4b55e] flex items-center justify-center shadow-xl">
                  <StoreIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-background" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Create Your Store
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-[#c0a146]" />
                  Step {currentStep} of {STEPS.length}
                </p>
              </div>
            </div>

            {hasDraft && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearDraft}
                className="gap-1.5 text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                <RotateCcw className="h-3 w-3" /> Clear Draft
              </Button>
            )}
          </div>

          {/* Step indicator */}
          <div className="flex justify-between items-center m-auto">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isComplete = completedSteps.includes(step.id);
              const clickable = step.id <= currentStep || isComplete;
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    type="button"
                    disabled={!clickable}
                    onClick={() => clickable && handleStepClick(step.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 flex-shrink-0 disabled:cursor-default",
                      clickable && "cursor-pointer",
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm",
                        isComplete
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : isActive
                            ? "bg-gradient-to-br from-[#c0a146] to-[#d4b55e] border-[#c0a146] text-white shadow-lg shadow-[#c0a146]/30 scale-110"
                            : "bg-muted/50 border-border text-muted-foreground",
                      )}
                    >
                      {isComplete ? (
                        <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <StepIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </div>
                    <div className="text-center hidden sm:block">
                      <p
                        className={cn(
                          "text-xs font-semibold",
                          isActive
                            ? "text-[#c0a146]"
                            : isComplete
                              ? "text-emerald-600"
                              : "text-muted-foreground",
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {step.subtitle}
                      </p>
                    </div>
                  </button>

                  {index < STEPS.length - 1 && (
                    <div className="flex-1 mx-2 sm:mx-3 mb-5 sm:mb-7">
                      <div className="h-0.5 w-full bg-border rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full bg-gradient-to-r from-[#c0a146] to-[#d4b55e] transition-all duration-500",
                            isComplete ? "w-full" : "w-0",
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile label */}
          <div className="sm:hidden mt-3 text-center">
            <p className="text-sm font-semibold text-[#c0a146]">
              {STEPS[currentStep - 1].title}
            </p>
            <p className="text-xs text-muted-foreground">
              {STEPS[currentStep - 1].subtitle}
            </p>
          </div>
        </AnimatedContainer>

        {/* ── Form ───────────────────────────────────────────────────────────── */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* STEP 1 — Store Identity */}
            {currentStep === 1 && (
              <AnimatedContainer animation="slideUp" delay={0.05}>
                <Card className="border-0 shadow-lg bg-transparent backdrop-blur-sm">
                  <CardContent className="p-5 sm:p-7 space-y-5">
                    <SectionHeading
                      icon={Building2}
                      title="Store Identity"
                      subtitle="What is your store called?"
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Store Name{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <IconInput
                              icon={StoreIcon}
                              placeholder="e.g., Fashion Hub"
                              field={field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Store URL{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="flex items-stretch overflow-hidden rounded-lg border border-border/50 focus-within:border-[#c0a146] transition-all">
                              <div className="flex items-center px-3 bg-muted/50 border-r">
                                <Link2 className="h-3.5 w-3.5 text-muted-foreground mr-1.5 flex-shrink-0" />
                                <span className="text-xs text-muted-foreground whitespace-nowrap hidden xs:inline">
                                  .../stores/
                                </span>
                              </div>
                              <Input
                                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-11"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Auto-generated from your store name
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Textarea
                                placeholder="Tell customers what makes your store special..."
                                className="pl-10 min-h-[110px] border-border/50 focus:border-[#c0a146] focus-visible:ring-0 focus-visible:ring-offset-0 resize-none transition-colors"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="categories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Categories</FormLabel>
                          <FormControl>
                            <IconInput
                              icon={Tag}
                              placeholder="Restaurants, Electronics, Fashion, Beauty..."
                              field={field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Separate with commas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </AnimatedContainer>
            )}

            {/* STEP 2 — Contact & Hours */}
            {currentStep === 2 && (
              <AnimatedContainer animation="slideUp" delay={0.05}>
                <Card className="border-0 shadow-lg bg-transparent backdrop-blur-sm">
                  <CardContent className="p-5 sm:p-7 space-y-5">
                    <SectionHeading
                      icon={User}
                      title="Contact & Hours"
                      subtitle="Location, phone & opening times"
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Store Address{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <IconInput
                              icon={MapPin}
                              placeholder="123 Main St, Enugu, Nigeria"
                              field={field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Your physical or business address
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Business Phone{" "}
                            <span className="ml-1 text-xs font-normal text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                              Preferably WhatsApp-enabled
                            </span>
                          </FormLabel>
                          <FormControl>
                            <IconInput
                              icon={Phone}
                              placeholder="+234 800 000 0000"
                              field={field}
                              type="tel"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Admin will call or message you on this number.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Business Hours */}
                    <div className="border-t border-border/40 pt-5">
                      <BusinessHoursEditor
                        value={businessHours}
                        onChange={setBusinessHours}
                        showHeading
                      />
                    </div>
                  </CardContent>
                </Card>
              </AnimatedContainer>
            )}

            {/* STEP 3 — Visual Identity */}
            {currentStep === 3 && (
              <AnimatedContainer animation="slideUp" delay={0.05}>
                <Card className="border-0 shadow-lg bg-transparent backdrop-blur-sm">
                  <CardContent className="p-5 sm:p-7 space-y-6">
                    <SectionHeading
                      icon={ImageIcon}
                      title="Visual Identity"
                      subtitle="Logo & banner are required to launch"
                    />

                    {/* Required notice banner */}
                    <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 px-4 py-3">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        Both a <strong>logo</strong> and a <strong>banner</strong> must be uploaded before your store can go live. They help customers recognise your brand.
                      </p>
                    </div>

                    {/* ── Logo ── */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          Store Logo <span className="text-destructive">*</span>
                        </p>
                        {logoPreview && (
                          <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Uploaded
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-5">
                        <div className="relative group flex-shrink-0">
                          <div
                            className={cn(
                              "h-24 w-24 rounded-2xl border-2 border-dashed bg-muted/30 overflow-hidden flex items-center justify-center transition-all",
                              logoError && !logoPreview
                                ? "border-destructive/60 bg-destructive/5"
                                : logoPreview
                                  ? "border-emerald-400/60 group-hover:border-emerald-500"
                                  : "border-border/60 group-hover:border-[#c0a146]/50",
                            )}
                          >
                            {logoPreview ? (
                              <>
                                <img
                                  src={logoPreview}
                                  alt="Logo"
                                  className="h-full w-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLogoPreview(null);
                                    form.setValue("logo_url", "");
                                    setLogoError(true);
                                  }}
                                  className="absolute top-1 right-1 h-6 w-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </>
                            ) : (
                              <div className="text-center p-2">
                                <Upload
                                  className={cn(
                                    "h-6 w-6 mx-auto mb-1",
                                    logoError ? "text-destructive/50" : "text-muted-foreground",
                                  )}
                                />
                                <p
                                  className={cn(
                                    "text-[10px]",
                                    logoError ? "text-destructive/70 font-medium" : "text-muted-foreground",
                                  )}
                                >
                                  {logoError ? "Required" : "Logo"}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <Button
                            variant="outline"
                            type="button"
                            size="sm"
                            className={cn(
                              "w-full h-10 transition-colors",
                              logoError && !logoPreview
                                ? "border-destructive/50 text-destructive hover:border-destructive hover:bg-destructive/5"
                                : "border-border/50 hover:border-[#c0a146]/50 hover:bg-[#c0a146]/5",
                            )}
                            onClick={() =>
                              document.getElementById("logo-upload")?.click()
                            }
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {logoPreview ? "Change Logo" : "Upload Logo"}
                          </Button>
                          {logoError && !logoPreview && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 flex-shrink-0" />
                              Logo is required to launch your store
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground text-center">
                            200×200px · PNG/JPG · Max 5MB
                          </p>
                        </div>
                      </div>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(e, setLogoPreview, setLogoError, "logo_url", "Logo")
                        }
                      />
                    </div>

                    <div className="border-t border-border/40" />

                    {/* ── Banner ── */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          Store Banner <span className="text-destructive">*</span>
                        </p>
                        {bannerPreview && (
                          <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Uploaded
                          </span>
                        )}
                      </div>

                      <div className="relative group">
                        <div
                          className={cn(
                            "aspect-[3/1] w-full rounded-xl border-2 border-dashed bg-muted/30 overflow-hidden flex items-center justify-center transition-all",
                            bannerError && !bannerPreview
                              ? "border-destructive/60 bg-destructive/5"
                              : bannerPreview
                                ? "border-emerald-400/60 group-hover:border-emerald-500"
                                : "border-border/60 group-hover:border-[#c0a146]/50",
                          )}
                        >
                          {bannerPreview ? (
                            <>
                              <img
                                src={bannerPreview}
                                alt="Banner"
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setBannerPreview(null);
                                  form.setValue("banner_url", "");
                                  setBannerError(true);
                                }}
                                className="absolute top-2 right-2 h-7 w-7 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <div className="text-center p-4">
                              <ImageIcon
                                className={cn(
                                  "h-7 w-7 mx-auto mb-1.5",
                                  bannerError ? "text-destructive/50" : "text-muted-foreground",
                                )}
                              />
                              <p
                                className={cn(
                                  "text-xs",
                                  bannerError ? "text-destructive/70 font-medium" : "text-muted-foreground",
                                )}
                              >
                                {bannerError ? "Banner is required" : "Click to upload banner"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        type="button"
                        size="sm"
                        className={cn(
                          "w-full h-10 transition-colors",
                          bannerError && !bannerPreview
                            ? "border-destructive/50 text-destructive hover:border-destructive hover:bg-destructive/5"
                            : "border-border/50 hover:border-[#c0a146]/50 hover:bg-[#c0a146]/5",
                        )}
                        onClick={() =>
                          document.getElementById("banner-upload")?.click()
                        }
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {bannerPreview ? "Change Banner" : "Upload Banner"}
                      </Button>

                      {bannerError && !bannerPreview && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 flex-shrink-0" />
                          Banner is required to launch your store
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground text-center">
                        1200×400px · PNG/JPG · Max 5MB
                      </p>
                      <input
                        id="banner-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(e, setBannerPreview, setBannerError, "banner_url", "Banner")
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </AnimatedContainer>
            )}

            {/* ── Navigation ─────────────────────────────────────────────────── */}
            <AnimatedContainer animation="fadeIn" delay={0.1}>
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleBack}
                    className="flex-1 sm:flex-none h-12 px-6 border-2 hover:border-[#c0a146]/50 hover:bg-[#c0a146]/5"
                  >
                    <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
                  </Button>
                )}

                {!isLastStep ? (
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleNext}
                    className="flex-1 h-12 px-6 bg-gradient-to-r from-[#c0a146] to-[#d4b55e] hover:from-[#d4b55e] hover:to-[#c0a146] text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Continue <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className={cn(
                      "flex-1 h-12 px-6 text-white shadow-lg transition-all duration-300",
                      readyToLaunch
                        ? "bg-gradient-to-r from-[#c0a146] to-[#d4b55e] hover:from-[#d4b55e] hover:to-[#c0a146] hover:shadow-xl"
                        : "bg-gradient-to-r from-[#c0a146]/50 to-[#d4b55e]/50 cursor-not-allowed opacity-70",
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Store...
                      </>
                    ) : (
                      <>
                        <StoreIcon className="mr-2 h-4 w-4" />
                        Launch Store
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Contextual hint below the button */}
              <p className="text-center text-xs mt-3">
                {isLastStep ? (
                  !readyToLaunch ? (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Upload{" "}
                      {!logoPreview && !bannerPreview
                        ? "a logo & banner"
                        : !logoPreview
                          ? "your logo"
                          : "your banner"}{" "}
                      to enable launch
                    </span>
                  ) : (
                    <span className="text-emerald-600 flex items-center justify-center gap-1">
                      <Check className="h-3 w-3" /> You're all set — ready to launch!
                    </span>
                  )
                ) : (
                  <span className="text-muted-foreground">
                    {STEPS.length - currentStep} step
                    {STEPS.length - currentStep > 1 ? "s" : ""} remaining
                  </span>
                )}
              </p>
            </AnimatedContainer>
          </form>
        </Form>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small local sub-components (private to this file)
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <div className="h-9 w-9 rounded-xl bg-[#c0a146]/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-[#c0a146]" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function IconInput({
  icon: Icon,
  placeholder,
  field,
  type = "text",
}: {
  icon: React.ElementType;
  placeholder: string;
  field: any;
  type?: string;
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type={type}
        placeholder={placeholder}
        className="pl-10 h-11 border-border/50 focus:border-[#c0a146] focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
        {...field}
      />
    </div>
  );
}