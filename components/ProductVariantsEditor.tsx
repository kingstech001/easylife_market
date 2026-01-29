"use client";

import { useState } from "react";
import {
  Plus,
  X,
  Palette,
  Ruler,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// Predefined colors
const PREDEFINED_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#EF4444" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Green", hex: "#22C55E" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Orange", hex: "#F97316" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Brown", hex: "#92400E" },
  { name: "Navy", hex: "#1E3A5F" },
  { name: "Beige", hex: "#D4C4A8" },
  { name: "Cream", hex: "#FFFDD0" },
  { name: "Maroon", hex: "#800000" },
  { name: "Teal", hex: "#14B8A6" },
];

// Predefined sizes
const SIZE_PRESETS = {
  clothing: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
  shoes: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
  numeric: ["6", "8", "10", "12", "14", "16", "18", "20"],
};

export interface SizeVariant {
  size: string;
  quantity: number;
}

export interface ColorVariant {
  name: string;
  hex: string;
}

export interface ProductVariant {
  color: ColorVariant;
  sizes: SizeVariant[];
  priceAdjustment?: number;
}

interface ProductVariantsEditorProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  category?: string;
}

export default function ProductVariantsEditor({
  variants,
  onChange,
  category,
}: ProductVariantsEditorProps) {
  const [expandedVariants, setExpandedVariants] = useState<Set<number>>(
    new Set([0]),
  );
  const [selectedSizePreset, setSelectedSizePreset] =
    useState<keyof typeof SIZE_PRESETS>("clothing");
  const [customColor, setCustomColor] = useState({ name: "", hex: "#000000" });

  const toggleVariantExpand = (index: number) => {
    const newExpanded = new Set(expandedVariants);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedVariants(newExpanded);
  };

  const addVariant = (color: ColorVariant) => {
    // Check if color already exists
    if (
      variants.some(
        (v) => v.color.hex.toLowerCase() === color.hex.toLowerCase(),
      )
    ) {
      return;
    }
    const newVariant: ProductVariant = {
      color,
      sizes: [{ size: "M", quantity: 0 }],
      priceAdjustment: 0,
    };
    const newVariants = [...variants, newVariant];
    onChange(newVariants);
    setExpandedVariants(new Set([...expandedVariants, newVariants.length - 1]));
  };

  const removeVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    onChange(newVariants);
    const newExpanded = new Set<number>();
    expandedVariants.forEach((i) => {
      if (i < index) newExpanded.add(i);
      else if (i > index) newExpanded.add(i - 1);
    });
    setExpandedVariants(newExpanded);
  };

  const updateVariantColor = (index: number, color: ColorVariant) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], color };
    onChange(newVariants);
  };

  const addSizeToVariant = (variantIndex: number, size: string) => {
    const newVariants = [...variants];
    // Check if size already exists
    if (newVariants[variantIndex].sizes.some((s) => s.size === size)) {
      return;
    }
    newVariants[variantIndex] = {
      ...newVariants[variantIndex],
      sizes: [...newVariants[variantIndex].sizes, { size, quantity: 0 }],
    };
    onChange(newVariants);
  };

  const removeSizeFromVariant = (variantIndex: number, sizeIndex: number) => {
    const newVariants = [...variants];
    newVariants[variantIndex] = {
      ...newVariants[variantIndex],
      sizes: newVariants[variantIndex].sizes.filter((_, i) => i !== sizeIndex),
    };
    onChange(newVariants);
  };

  const updateSizeQuantity = (
    variantIndex: number,
    sizeIndex: number,
    quantity: number,
  ) => {
    const newVariants = [...variants];
    newVariants[variantIndex].sizes[sizeIndex] = {
      ...newVariants[variantIndex].sizes[sizeIndex],
      quantity: Math.max(0, quantity),
    };
    onChange(newVariants);
  };

  const addCustomColor = () => {
    if (customColor.name.trim()) {
      addVariant(customColor);
      setCustomColor({ name: "", hex: "#000000" });
    }
  };

  const addAllSizesFromPreset = (variantIndex: number) => {
    const preset = SIZE_PRESETS[selectedSizePreset];
    const newVariants = [...variants];
    const existingSizes = new Set(
      newVariants[variantIndex].sizes.map((s) => s.size),
    );
    const newSizes = preset
      .filter((size) => !existingSizes.has(size))
      .map((size) => ({ size, quantity: 0 }));
    newVariants[variantIndex] = {
      ...newVariants[variantIndex],
      sizes: [...newVariants[variantIndex].sizes, ...newSizes],
    };
    onChange(newVariants);
  };

  const getTotalQuantity = () => {
    return variants.reduce((total, variant) => {
      return (
        total +
        variant.sizes.reduce((sizeTotal, size) => sizeTotal + size.quantity, 0)
      );
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between">
        <div className="space-y-1 mb-4 sm:mb-0">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-[#c0a146]/10">
              <Palette className="h-5 w-5 text-[#c0a146]" />
            </div>
            <h3 className="text-lg font-semibold">Product Variants</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Add color and size options for your {category || "product"}
          </p>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          Total: {getTotalQuantity()} items
        </Badge>
      </div>

      {/* Quick Add Colors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Add Color Variant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_COLORS.map((color) => {
              const isAdded = variants.some(
                (v) => v.color.hex.toLowerCase() === color.hex.toLowerCase(),
              );
              return (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => !isAdded && addVariant(color)}
                  disabled={isAdded}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-sm",
                    isAdded
                      ? "opacity-50 cursor-not-allowed border-muted"
                      : "hover:border-[#c0a146] hover:bg-[#c0a146]/5 cursor-pointer",
                  )}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-border"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span>{color.name}</span>
                  {isAdded && (
                    <Badge variant="secondary" className="text-xs py-0">
                      Added
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Color */}
          <div className="flex items-end gap-3 pt-2 border-t">
            <div className="flex-1">
              <Label className="text-sm">Custom Color Name</Label>
              <Input
                value={customColor.name}
                onChange={(e) =>
                  setCustomColor({ ...customColor, name: e.target.value })
                }
                placeholder="e.g., Burgundy"
                className="mt-1"
              />
            </div>
            <div className="w-24">
              <Label className="text-sm">Color</Label>
              <div className="relative mt-1">
                <Input
                  type="color"
                  value={customColor.hex}
                  onChange={(e) =>
                    setCustomColor({ ...customColor, hex: e.target.value })
                  }
                  className="h-10 p-1 cursor-pointer"
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={addCustomColor}
              disabled={!customColor.name.trim()}
              size="sm"
              className="bg-[#c0a146] hover:bg-[#c0a146]/90"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Size Preset Selector */}
      <div className="flex items-center gap-3">
        <Label className="text-sm whitespace-nowrap">Size preset:</Label>
        <Select
          value={selectedSizePreset}
          onValueChange={(value) =>
            setSelectedSizePreset(value as keyof typeof SIZE_PRESETS)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clothing">Clothing (XS-3XL)</SelectItem>
            <SelectItem value="shoes">Shoes (36-46)</SelectItem>
            <SelectItem value="numeric">Numeric (6-20)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Variants List */}
      {variants.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <h4 className="font-medium mb-1">No variants added yet</h4>
            <p className="text-sm text-muted-foreground">
              Click on a color above to add your first variant
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {variants.map((variant, variantIndex) => (
            <Collapsible
              key={`variant-${variantIndex}`}
              open={expandedVariants.has(variantIndex)}
              onOpenChange={() => toggleVariantExpand(variantIndex)}
            >
              <Card
                className={cn(
                  "transition-all",
                  expandedVariants.has(variantIndex) && "border-[#c0a146]/50",
                )}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-8 h-8 rounded-lg border-2 border-border shadow-sm"
                          style={{ backgroundColor: variant.color.hex }}
                        />
                        <div>
                          <CardTitle className="text-base">
                            {variant.color.name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {variant.sizes.length} sizes,{" "}
                            {variant.sizes.reduce(
                              (sum, s) => sum + s.quantity,
                              0,
                            )}{" "}
                            total items
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeVariant(variantIndex);
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {expandedVariants.has(variantIndex) ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    {/* Size Management */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                          <Ruler className="h-4 w-4" />
                          Sizes & Quantities
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addAllSizesFromPreset(variantIndex)}
                          className="text-xs bg-transparent"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add All {selectedSizePreset} Sizes
                        </Button>
                      </div>

                      {/* Sizes Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {variant.sizes.map((sizeVariant, sizeIndex) => (
                          <div
                            key={`size-${variantIndex}-${sizeIndex}`}
                            className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30"
                          >
                            <Badge variant="secondary" className="font-mono">
                              {sizeVariant.size}
                            </Badge>
                            <Input
                              type="number"
                              min="0"
                              value={sizeVariant.quantity}
                              onChange={(e) =>
                                updateSizeQuantity(
                                  variantIndex,
                                  sizeIndex,
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="h-8 w-16 text-center"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeSizeFromVariant(variantIndex, sizeIndex)
                              }
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      {/* Quick Add Sizes */}
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                        {SIZE_PRESETS[selectedSizePreset]
                          .filter(
                            (size) =>
                              !variant.sizes.some((s) => s.size === size),
                          )
                          .map((size) => (
                            <Button
                              key={size}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                addSizeToVariant(variantIndex, size)
                              }
                              className="h-7 px-2 text-xs bg-transparent"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {size}
                            </Button>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
