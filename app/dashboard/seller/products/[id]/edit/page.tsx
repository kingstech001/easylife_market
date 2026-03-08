"use client";

import type React from "react";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  ImageIcon,
  Loader2,
  Package,
  Tag,
  Layers,
  Upload,
  Trash2,
  Save,
  Info,
  Palette,
  UtensilsCrossed,
  ChevronDown,
  ChevronUp,
  GripVertical,
  AlertCircle,
  CheckCircle2,
  Plus,
  ToggleLeft,
  ToggleRight,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductVariantsEditor, { type ProductVariant } from "@/components/ProductVariantsEditor";
import { VARIANT_CATEGORIES } from "@/lib/variant-categories";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Modifier types
// ─────────────────────────────────────────────────────────────────────────────

interface ModifierOption {
  _id?: string;
  name: string;
  priceAdjustment: number;
  inventoryQuantity?: number;
  isActive: boolean;
}

interface ModifierGroup {
  _id?: string;
  name: string;
  required: boolean;
  selectionType: "single" | "multiple";
  minSelection: number;
  maxSelection: number;
  options: ModifierOption[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Modifier helpers
// ─────────────────────────────────────────────────────────────────────────────

function newOption(): ModifierOption {
  return { name: "", priceAdjustment: 0, isActive: true };
}

function newGroup(): ModifierGroup {
  return {
    name: "",
    required: false,
    selectionType: "single",
    minSelection: 0,
    maxSelection: 1,
    options: [newOption()],
  };
}

function groupIsValid(g: ModifierGroup): boolean {
  if (!g.name.trim()) return false;
  if (g.options.length === 0) return false;
  if (g.options.some((o) => !o.name.trim())) return false;
  if (g.minSelection > g.maxSelection) return false;
  if (g.selectionType === "single" && g.maxSelection !== 1) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// ModifierGroupCard
// ─────────────────────────────────────────────────────────────────────────────

function ModifierGroupCard({
  group,
  isOpen,
  onToggle,
  onRemove,
  onUpdateGroup,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
}: {
  group: ModifierGroup;
  isOpen: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onUpdateGroup: (patch: Partial<ModifierGroup>) => void;
  onAddOption: () => void;
  onRemoveOption: (oi: number) => void;
  onUpdateOption: (oi: number, patch: Partial<ModifierOption>) => void;
}) {
  const valid = groupIsValid(group);

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-200",
        isOpen
          ? "border-orange-300 dark:border-orange-700 shadow-md shadow-orange-100 dark:shadow-orange-950/30"
          : "border-border hover:border-orange-200 dark:hover:border-orange-800",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 cursor-pointer select-none rounded-2xl transition-colors",
          isOpen ? "bg-orange-50/60 dark:bg-orange-950/20" : "bg-card",
        )}
        onClick={onToggle}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm truncate">
            {group.name || (
              <span className="text-muted-foreground font-normal italic">Untitled group</span>
            )}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {group.required ? (
              <Badge className="text-[10px] h-4 px-1.5 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-0">
                Required
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Optional</Badge>
            )}
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400">
              {group.selectionType === "single" ? "Pick 1" : `Pick ${group.minSelection}–${group.maxSelection}`}
            </Badge>
            {group.options.length > 0 && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                {group.options.length} option{group.options.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          {valid ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          {isOpen
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 space-y-5 border-t border-border/50">
              {/* Group name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Group Name</Label>
                <Input
                  placeholder='e.g. "Choose your soup", "Add-ons", "Drink"'
                  value={group.name}
                  onChange={(e) => onUpdateGroup({ name: e.target.value })}
                  className="h-10 text-sm focus:border-orange-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              {/* Rules */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:flex-col sm:items-start gap-2 rounded-xl border border-border/60 px-3 py-2.5 bg-muted/20">
                  <Label className="text-xs font-medium text-muted-foreground">Required?</Label>
                  <Switch
                    checked={group.required}
                    onCheckedChange={(v) => onUpdateGroup({ required: v })}
                    className="data-[state=checked]:bg-orange-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-1.5 rounded-xl border border-border/60 px-3 py-2.5 bg-muted/20">
                  <Label className="text-xs font-medium text-muted-foreground">Selection</Label>
                  <Select
                    value={group.selectionType}
                    onValueChange={(v: "single" | "multiple") => onUpdateGroup({ selectionType: v })}
                  >
                    <SelectTrigger className="h-8 text-xs border-0 bg-transparent p-0 focus:ring-0 shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single" className="text-xs">Single (pick 1)</SelectItem>
                      <SelectItem value="multiple" className="text-xs">Multiple (pick many)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 rounded-xl border border-border/60 px-3 py-2.5 bg-muted/20">
                  <Label className="text-xs font-medium text-muted-foreground">Min picks</Label>
                  <Input
                    type="number" min={0} max={group.maxSelection} value={group.minSelection}
                    disabled={group.selectionType === "single"}
                    onChange={(e) => onUpdateGroup({ minSelection: Math.max(0, Number(e.target.value)) })}
                    className="h-8 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="space-y-1.5 rounded-xl border border-border/60 px-3 py-2.5 bg-muted/20">
                  <Label className="text-xs font-medium text-muted-foreground">Max picks</Label>
                  <Input
                    type="number" min={1} value={group.maxSelection}
                    disabled={group.selectionType === "single"}
                    onChange={(e) => onUpdateGroup({ maxSelection: Math.max(1, Number(e.target.value)) })}
                    className="h-8 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {group.selectionType === "single" && (
                <p className="text-[11px] text-muted-foreground -mt-2">
                  Single selection locks max to 1. Switch to <strong>Multiple</strong> to allow 2+ picks.
                </p>
              )}

              {/* Options */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Options</Label>
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {group.options.map((opt, oi) => (
                      <motion.div
                        key={oi}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-2"
                      >
                        <button
                          type="button"
                          title={opt.isActive ? "Mark unavailable" : "Mark available"}
                          onClick={() => onUpdateOption(oi, { isActive: !opt.isActive })}
                          className="flex-shrink-0"
                        >
                          {opt.isActive
                            ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                            : <ToggleLeft className="w-5 h-5 text-muted-foreground/40" />}
                        </button>
                        <Input
                          placeholder="Option name (e.g. Ofe Onugbu)"
                          value={opt.name}
                          onChange={(e) => onUpdateOption(oi, { name: e.target.value })}
                          className={cn(
                            "flex-1 h-9 text-sm focus:border-orange-400 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors",
                            !opt.isActive && "opacity-50 line-through",
                          )}
                        />
                        <div className="relative w-24 flex-shrink-0">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">₦</span>
                          <Input
                            type="number" step="50" title="Extra charge (0 = no extra charge)" placeholder="0"
                            value={opt.priceAdjustment === 0 ? "" : opt.priceAdjustment}
                            onChange={(e) => onUpdateOption(oi, { priceAdjustment: Number(e.target.value) })}
                            className="pl-6 h-9 text-sm focus:border-orange-400 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <Button
                          type="button" variant="ghost" size="sm"
                          disabled={group.options.length === 1}
                          onClick={() => onRemoveOption(oi)}
                          className="h-9 w-9 p-0 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive disabled:opacity-20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <Button
                  type="button" variant="outline" size="sm" onClick={onAddOption}
                  className="w-full h-8 border-dashed border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-300 text-xs gap-1.5 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Option
                </Button>
              </div>

              {!valid && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {!group.name.trim()
                      ? "Give this group a name."
                      : group.options.some((o) => !o.name.trim())
                        ? "All options need a name."
                        : "Check your min/max settings."}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Unchanged helpers + schemas (from original)
// ─────────────────────────────────────────────────────────────────────────────

function categorySupportsVariants(category: string | undefined): boolean {
  if (!category) return false;
  const normalizedCategory = category.toLowerCase().trim();
  return VARIANT_CATEGORIES.some(
    (vc) =>
      normalizedCategory.includes(vc.toLowerCase()) ||
      vc.toLowerCase().includes(normalizedCategory)
  );
}

const variantSchema = z.object({
  color: z.object({
    name: z.string().min(1, "Color name is required"),
    hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  }),
  sizes: z
    .array(
      z.object({
        size: z.string().min(1, "Size is required"),
        quantity: z.number().min(0, "Quantity must be non-negative"),
      })
    )
    .min(1, "At least one size is required"),
  priceAdjustment: z.number().optional(),
});

type Product = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  category?: string;
  inventoryQuantity: number;
  images?: { url: string; altText?: string }[];
  hasVariants?: boolean;
  variants?: Array<{
    color: { name: string; hex: string };
    sizes: Array<{ size: string; quantity: number }>;
    priceAdjustment?: number;
  }>;
  hasModifiers?: boolean;       // ← NEW
  modifierGroups?: ModifierGroup[]; // ← NEW
  createdAt: string;
  updatedAt: string;
};

const productFormSchema = z.object({
  name: z.string().min(3, {
    message: "Product name must be at least 3 characters.",
  }),
  description: z.string().optional(),
  price: z.number().positive({ message: "Price must be a positive number." }),
  compareAtPrice: z.number().positive().optional().or(z.literal(0)).optional(),
  category: z.string().optional(),
  inventoryQuantity: z.number().int().nonnegative(),
  images: z
    .array(
      z.object({
        url: z.string(),
        altText: z.string().optional(),
      }),
    )
    .optional(),
  hasVariants: z.boolean().optional(),
  variants: z.array(variantSchema).optional(),
  hasModifiers: z.boolean().optional(), // ← NEW
});

type ProductFormValues = z.infer<typeof productFormSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Debug logging — unchanged
  console.log("🔍 Params:", params);
  console.log("🔍 ID:", id);
  console.log("🔍 ID type:", typeof id);

  const [isLoading, setIsLoading] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Debug: Log active tab changes — unchanged
  useEffect(() => {
    console.log("🔄 Active tab changed to:", activeTab);
  }, [activeTab]);

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // ── NEW: modifier state ──────────────────────────────────────────────────
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [expandedGroupIndex, setExpandedGroupIndex] = useState<number | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      compareAtPrice: undefined,
      category: "",
      inventoryQuantity: 0,
      images: [],
      hasVariants: false,
      variants: [],
      hasModifiers: false, // ← NEW
    },
  });

  const watchedCategory = form.watch("category");
  const watchedHasVariants = form.watch("hasVariants");
  const watchedVariants = form.watch("variants");
  const watchedHasModifiers = form.watch("hasModifiers"); // ← NEW

  // Check if current category supports variants — unchanged
  const supportsVariants = useMemo(() => {
    return categorySupportsVariants(watchedCategory);
  }, [watchedCategory]);

  // Reset variants when category changes to non-supporting — unchanged
  useEffect(() => {
    if (!supportsVariants && watchedHasVariants) {
      form.setValue("hasVariants", false);
      form.setValue("variants", []);
    }
  }, [supportsVariants, watchedHasVariants, form]);

  // Clear modifier groups when hasModifiers toggled off — NEW
  useEffect(() => {
    if (!watchedHasModifiers) {
      setModifierGroups([]);
      setExpandedGroupIndex(null);
    }
  }, [watchedHasModifiers]);

  // Auto-save variants to database when they change — unchanged
  useEffect(() => {
    if (!id) return;

    const saveVariants = async () => {
      try {
        const response = await fetch(`/api/dashboard/seller/products/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hasVariants: watchedHasVariants,
            variants: watchedHasVariants ? watchedVariants : [],
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("[v0] Failed to save variants:", error);
        } else {
          console.log("[v0] Variants saved successfully");
        }
      } catch (error) {
        console.error("[v0] Error saving variants:", error);
      }
    };

    // Debounce the save to avoid too many requests
    const timer = setTimeout(saveVariants, 1000);
    return () => clearTimeout(timer);
  }, [id, watchedHasVariants, watchedVariants]);

  const [isDragOver, setIsDragOver] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!id) {
      console.error("❌ No ID available for fetching product");
      setProductError("Product ID is missing");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setProductError(null);

    const apiUrl = `/api/dashboard/seller/products/${id}`;
    console.log("📡 Fetching from:", apiUrl);

    try {
      const response = await fetch(`/api/dashboard/seller/products/${id}`);
      if (!response.ok) {
        let errorMessage = "Failed to fetch product details.";

        try {
          const errorData = await response.json();
          console.error("❌ Error data:", errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          try {
            const errorText = await response.text();
            console.error("❌ Error text:", errorText);
            if (errorText) {
              errorMessage = `Server error: ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
            }
          } catch {}
        }

        throw new Error(errorMessage);
      }

      const data: { product: Product } = await response.json();
      console.log("✅ Product data received:", data);
      const product = data.product;

      form.reset({
        name: product.name,
        description: product.description || "",
        price: product.price,
        compareAtPrice: product.compareAtPrice || undefined,
        category: product.category || "",
        inventoryQuantity: product.inventoryQuantity,
        images: product.images || [],
        hasVariants: product.hasVariants || false,
        variants: product.variants || [],
        hasModifiers: product.hasModifiers || false, // ← NEW
      });

      // Restore modifier groups from fetched product — NEW
      if (product.modifierGroups && product.modifierGroups.length > 0) {
        setModifierGroups(product.modifierGroups);
      }

      if (product.images) {
        setImagePreviews(product.images.map((img) => img.url));
      }
    } catch (err: any) {
      console.error("❌ Fetch error:", err);
      setProductError(err.message || "An unexpected error occurred.");
      toast.error("Failed to load product", {
        description: err.message || "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, form]);

  useEffect(() => {
    console.log("🔄 useEffect triggered, ID:", id);
    if (id) {
      console.log("✅ ID exists, fetching product...");
      fetchProduct();
    } else {
      console.error("❌ ID is undefined in useEffect");
      setProductError("Product ID is missing");
      setIsLoading(false);
    }
  }, [fetchProduct, id]);

  // ── Modifier group mutations — NEW ────────────────────────────────────────

  const addModifierGroup = () => {
    const updated = [...modifierGroups, newGroup()];
    setModifierGroups(updated);
    setExpandedGroupIndex(updated.length - 1);
  };

  const removeModifierGroup = (gi: number) => {
    setModifierGroups((prev) => prev.filter((_, i) => i !== gi));
    if (expandedGroupIndex === gi) setExpandedGroupIndex(null);
    else if (expandedGroupIndex !== null && expandedGroupIndex > gi)
      setExpandedGroupIndex(expandedGroupIndex - 1);
  };

  const updateModifierGroup = (gi: number, patch: Partial<ModifierGroup>) => {
    setModifierGroups((prev) =>
      prev.map((g, i) => {
        if (i !== gi) return g;
        const next = { ...g, ...patch };
        if (patch.selectionType === "single") {
          next.maxSelection = 1;
          next.minSelection = next.required ? 1 : Math.min(next.minSelection, 1);
        }
        if (patch.required && next.selectionType === "single") next.minSelection = 1;
        if (patch.required === false && next.selectionType === "single") next.minSelection = 0;
        if (patch.minSelection !== undefined && next.minSelection > next.maxSelection) next.maxSelection = next.minSelection;
        if (patch.maxSelection !== undefined && next.maxSelection < next.minSelection) next.minSelection = next.maxSelection;
        return next;
      }),
    );
  };

  const addModifierOption = (gi: number) => {
    setModifierGroups((prev) =>
      prev.map((g, i) => i === gi ? { ...g, options: [...g.options, newOption()] } : g),
    );
  };

  const removeModifierOption = (gi: number, oi: number) => {
    setModifierGroups((prev) =>
      prev.map((g, i) => i === gi ? { ...g, options: g.options.filter((_, j) => j !== oi) } : g),
    );
  };

  const updateModifierOption = (gi: number, oi: number, patch: Partial<ModifierOption>) => {
    setModifierGroups((prev) =>
      prev.map((g, i) =>
        i === gi
          ? { ...g, options: g.options.map((o, j) => j === oi ? { ...o, ...patch } : o) }
          : g,
      ),
    );
  };

  // ── Image handlers — unchanged ────────────────────────────────────────────

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFilesArray = Array.from(files).slice(0, 5 - imagePreviews.length);
    if (newFilesArray.length === 0) {
      toast.info("Maximum 5 images allowed.", {
        description: "Please remove existing images to upload more.",
      });
      return;
    }

    setIsUploadingImages(true);
    const uploadedImageUrls: { url: string; altText?: string }[] = [];

    for (const file of newFilesArray) {
      if (!file.type.startsWith("image/")) {
        toast.error(`File "${file.name}" is not an image.`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          let errorMessage = "Image upload failed.";

          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            try {
              const errorText = await response.text();
              errorMessage = `Server error: ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
            } catch {}
          }

          throw new Error(errorMessage);
        }

        const result = await response.json();
        uploadedImageUrls.push({
          url: result.secure_url,
          altText: `${form.getValues("name") || "Product"} image ${
            imagePreviews.length + uploadedImageUrls.length + 1
          }`,
        });

        setImagePreviews((prev) => [...prev, result.secure_url]);
        toast.success(`Image "${file.name}" uploaded.`);
      } catch (error: any) {
        toast.error(`Failed to upload "${file.name}"`, {
          description: error.message || "Please try again.",
        });
      }
    }

    const currentImages = form.getValues("images") || [];
    form.setValue("images", [...currentImages, ...uploadedImageUrls]);
    setIsUploadingImages(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleImageUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = (indexToRemove: number) => {
    const updatedPreviews = imagePreviews.filter((_, i) => i !== indexToRemove);
    const updatedImages = (form.getValues("images") || []).filter(
      (_, i) => i !== indexToRemove,
    );

    setImagePreviews(updatedPreviews);
    form.setValue("images", updatedImages);
    toast.info("Image removed.");
  };

  // ── Submit — now includes modifierGroups ─────────────────────────────────

  async function onSubmit(data: ProductFormValues) {
    if (!id) {
      toast.error("Product ID is missing", {
        description: "Cannot update product without ID.",
      });
      return;
    }

    setIsSubmitting(true);
    const apiUrl = `/api/dashboard/seller/products/${id}`;
    console.log("📡 Updating product at:", apiUrl);

    try {
      // Calculate total inventory from variants if hasVariants is true — unchanged
      let totalInventory = data.inventoryQuantity;
      if (data.hasVariants && data.variants && data.variants.length > 0) {
        totalInventory = data.variants.reduce((total, variant) => {
          return total + variant.sizes.reduce((sizeTotal, size) => sizeTotal + size.quantity, 0);
        }, 0);
      }

      const cleanedData = {
        ...data,
        category: data.category?.trim() || undefined,
        compareAtPrice: data.compareAtPrice || undefined,
        description: data.description?.trim() || undefined,
        inventoryQuantity: totalInventory,
        hasVariants: data.hasVariants || false,
        variants: data.hasVariants ? data.variants || [] : [],
        // ── NEW ──
        hasModifiers: data.hasModifiers || false,
        modifierGroups: data.hasModifiers ? modifierGroups : [],
      };

      const response = await fetch(`/api/dashboard/seller/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      });

      console.log("📡 Update response status:", response.status);

      if (!response.ok) {
        let errorMessage = "Failed to update product.";

        try {
          const errorData = await response.json();
          console.error("❌ Update error data:", errorData);
          errorMessage = errorData.message || errorMessage;
        } catch {
          try {
            const errorText = await response.text();
            console.error("❌ Update error text:", errorText);
            errorMessage = `Server error: ${errorText.substring(0, Math.min(errorText.length, 100))}...`;
          } catch {}
        }

        throw new Error(errorMessage);
      }

      console.log("✅ Product updated successfully");
      toast.success("Product updated successfully!", {
        description: "Your product changes have been saved.",
      });
      router.push("/dashboard/seller/products");
    } catch (error: any) {
      console.error("❌ Update error:", error);
      toast.error("Failed to update product", {
        description: error.message || "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Loading / error states — unchanged ───────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-4 text-lg text-muted-foreground">
          Loading product...
        </span>
      </div>
    );
  }

  if (productError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-destructive">
        <p className="text-lg">Error loading product: {productError}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Product ID: {id || "undefined"}
        </p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="container p-0 max-w-4xl mx-auto py-4 sm:py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 -ml-4 hover:bg-muted"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to Products</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div className="sm:flex items-start gap-3 sm:gap-4 justify-between p-0">
            <div>
              <div className="flex gap-2 items-center">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 flex-shrink-0">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Edit Product
                </h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Modify details for {form.getValues("name") || "this product"}
              </p>
            </div>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting || isUploadingImages}
              className="ml-auto w-full sm:w-auto mt-2 sm:m-0"
            >
              {isSubmitting ? (
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
        </motion.div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 sm:space-y-8"
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4 sm:space-y-6"
            >
              {/* ── Tab bar: 4 original → 5 with Modifiers ── */}
              <TabsList className="grid w-full grid-cols-5 h-10 sm:h-12 bg-muted/50 dark:bg-muted/20 p-1">
                <TabsTrigger
                  value="details"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline sm:hidden">Details</span>
                  <span className="hidden sm:inline">Details</span>
                </TabsTrigger>
                <TabsTrigger
                  value="images"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-3"
                >
                  <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Images</span>
                </TabsTrigger>
                <TabsTrigger
                  value="inventory"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Layers className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline sm:hidden">Stock</span>
                  <span className="hidden sm:inline">Inventory</span>
                </TabsTrigger>
                <TabsTrigger
                  value="variants"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-3"
                  disabled={!supportsVariants}
                >
                  <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Variants</span>
                </TabsTrigger>
                {/* ── NEW ── */}
                <TabsTrigger
                  value="modifiers"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-orange-600 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <UtensilsCrossed className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Modifiers</span>
                </TabsTrigger>
              </TabsList>

              {/* ── Details Tab — UNCHANGED ── */}
              <TabsContent value="details" className="mt-4 sm:mt-6">
                <div>
                  <Card className="border-0 shadow-sm bg-card/50 dark:bg-card/20">
                    <CardHeader className="pb-4 sm:pb-6">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Tag className="h-4 w-4 sm:h-5 sm:w-5" />
                        Product Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter product name"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              This is the name that will be displayed to
                              customers.
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
                              <Textarea
                                placeholder="Describe your product..."
                                className="min-h-[120px] resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Provide a detailed description of your product.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Regular selling price
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="compareAtPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Compare at Price (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? parseFloat(e.target.value)
                                        : undefined,
                                    )
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Original price (for discounts)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Electronics, Clothing"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Product category for organization
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ── Inventory Tab — UNCHANGED ── */}
              <TabsContent value="inventory" className="mt-4 sm:mt-6">
                <div>
                  <Card className="border-0 shadow-sm bg-card/50 dark:bg-card/20">
                    <CardHeader className="pb-4 sm:pb-6">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
                        Inventory Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                      {watchedHasVariants ? (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Palette className="h-5 w-5 text-primary mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-foreground mb-1">Variants Enabled</p>
                              <p className="text-muted-foreground">
                                Inventory is managed per variant. Go to the Variants tab to set quantities for each
                                color/size combination.
                              </p>
                              <p className="text-primary font-medium mt-2">
                                Total inventory:{" "}
                                {watchedVariants?.reduce(
                                  (total, v) => total + v.sizes.reduce((st, s) => st + s.quantity, 0),
                                  0
                                ) || 0}{" "}
                                items
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <FormField
                          control={form.control}
                          name="inventoryQuantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stock Quantity</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseInt(e.target.value) || 0)
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Number of items available for sale
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4">
                        <div className="flex gap-3">
                          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Inventory Tips
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              Keep your stock levels up to date to avoid
                              overselling. Consider setting a low stock alert
                              threshold.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ── Images Tab — UNCHANGED ── */}
              <TabsContent value="images" className="mt-4 sm:mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div
                    className="relative border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors"
                    onMouseEnter={() => setIsDragOver(true)}
                    onMouseLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      disabled={imagePreviews.length >= 5 || isUploadingImages}
                    />

                    <div className="space-y-3 sm:space-y-4">
                      <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-full flex items-center justify-center">
                        {isUploadingImages ? (
                          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground animate-spin" />
                        ) : (
                          <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium">
                          {isUploadingImages
                            ? "Uploading images..."
                            : imagePreviews.length >= 5
                              ? "Maximum images reached"
                              : "Drop images here or click to upload"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, GIF up to 10MB each
                        </p>
                      </div>
                    </div>
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
                      {imagePreviews.map((preview, index) => (
                        <motion.div
                          key={`image-${index}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group aspect-square rounded-lg overflow-hidden border bg-muted shadow-sm"
                        >
                          <img
                            src={preview || "/placeholder.svg"}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />

                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => removeImage(index)}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>

                          {index === 0 && (
                            <Badge className="absolute top-1 left-1 sm:top-2 sm:left-2 text-xs">
                              Main
                            </Badge>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              {/* ── Variants Tab — UNCHANGED ── */}
              <TabsContent value="variants" className="mt-4 sm:mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-sm bg-card/50 dark:bg-card/20">
                    <CardHeader className="pb-4 px-0 sm:pb-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                          <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                          Color & Size Variants
                        </CardTitle>
                        {supportsVariants && (
                          <FormField
                            control={form.control}
                            name="hasVariants"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 mt-2">
                                <FormLabel className="text-sm font-normal">Enable variants</FormLabel>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} style={{ margin:"0"}} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 p-0">
                      {supportsVariants ? (
                        watchedHasVariants ? (
                          <ProductVariantsEditor
                            variants={(watchedVariants as ProductVariant[]) || []}
                            onChange={(newVariants) => {
                              form.setValue("variants", newVariants, { shouldDirty: true });
                            }}
                            category={watchedCategory}
                          />
                        ) : (
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-2xl p-12 text-center bg-muted/20">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                              <Palette className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Variants Disabled</h3>
                            <p className="text-muted-foreground text-sm mb-4">
                              Enable variants to add color and size options to your product
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => form.setValue("hasVariants", true)}
                              className="bg-transparent"
                            >
                              <Palette className="w-4 h-4 mr-2" />
                              Enable Variants
                            </Button>
                          </div>
                        )
                      ) : (
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-2xl p-12 text-center bg-muted/20">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                            <Palette className="w-8 h-8 text-muted-foreground/50" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">Variants Not Available</h3>
                          <p className="text-muted-foreground text-sm max-w-md mx-auto">
                            Color and size variants are only available for clothing, fashion, and related categories.
                            Update your product category to enable this feature.
                          </p>
                          <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {VARIANT_CATEGORIES.slice(0, 6).map((cat) => (
                              <Badge key={cat} variant="secondary" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* ── Modifiers Tab — NEW ── */}
              <TabsContent value="modifiers" className="mt-4 sm:mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-sm bg-card/50 dark:bg-card/20">
                    <CardHeader className="px-2 py-4 sm:pb-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                          <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                          Food Modifier Groups
                        </CardTitle>
                        <FormField
                          control={form.control}
                          name="hasModifiers"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 flex-shrink-0">
                              <FormLabel className="text-sm font-normal">Enable modifiers</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-orange-500"
                                  style={{ margin: "0" }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Let customers customise their order — soups, proteins, extras, drinks
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4 px-2 sm:px-6 pb-6">
                      {watchedHasModifiers ? (
                        <div className="space-y-3">
                          {/* Hint banner */}
                          <div className="flex items-start gap-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 px-4 py-3">
                            <UtensilsCrossed className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                              Example for <strong>Akpu</strong>: add a group{" "}
                              <em>&ldquo;Choose your soup&rdquo;</em> → Required, Multiple, min{" "}
                              <strong>1</strong>, max <strong>2</strong> → options like{" "}
                              <em>Ofe Onugbu, Egusi, Oha</em> with optional extra charges per option.
                            </p>
                          </div>

                          {/* Empty state */}
                          {modifierGroups.length === 0 && (
                            <div className="border-2 border-dashed border-orange-200 dark:border-orange-800/40 rounded-2xl p-10 text-center bg-orange-50/30 dark:bg-orange-950/10">
                              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                                <UtensilsCrossed className="w-7 h-7 text-orange-400" />
                              </div>
                              <h3 className="text-base font-semibold mb-1">No modifier groups yet</h3>
                              <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                                Add groups like &ldquo;Choose your soup&rdquo;,{" "}
                                &ldquo;Extra protein&rdquo;, &ldquo;Drink options&rdquo;
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 gap-2"
                                onClick={addModifierGroup}
                              >
                                <Plus className="w-4 h-4" /> Add First Group
                              </Button>
                            </div>
                          )}

                          {/* Group cards */}
                          <AnimatePresence initial={false}>
                            {modifierGroups.map((group, gi) => (
                              <motion.div
                                key={gi}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18 }}
                              >
                                <ModifierGroupCard
                                  group={group}
                                  isOpen={expandedGroupIndex === gi}
                                  onToggle={() =>
                                    setExpandedGroupIndex(expandedGroupIndex === gi ? null : gi)
                                  }
                                  onRemove={() => removeModifierGroup(gi)}
                                  onUpdateGroup={(patch) => updateModifierGroup(gi, patch)}
                                  onAddOption={() => addModifierOption(gi)}
                                  onRemoveOption={(oi) => removeModifierOption(gi, oi)}
                                  onUpdateOption={(oi, patch) => updateModifierOption(gi, oi, patch)}
                                />
                              </motion.div>
                            ))}
                          </AnimatePresence>

                          {/* Add another group */}
                          {modifierGroups.length > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={addModifierGroup}
                              className="w-full h-10 border-dashed border-orange-300 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-400 gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Add Another Group
                            </Button>
                          )}
                        </div>
                      ) : (
                        /* Disabled placeholder */
                        <div className="border-2 border-dashed border-orange-200 dark:border-orange-800/40 rounded-2xl p-12 text-center bg-orange-50/30 dark:bg-orange-950/10">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                            <UtensilsCrossed className="w-8 h-8 text-orange-300" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">Modifiers Disabled</h3>
                          <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">
                            Enable modifiers to let customers pick soups, proteins, sides, drinks and more when ordering food items.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                            onClick={() => form.setValue("hasModifiers", true)}
                          >
                            <UtensilsCrossed className="w-4 h-4 mr-2" />
                            Enable Modifiers
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </div>
    </div>
  );
}