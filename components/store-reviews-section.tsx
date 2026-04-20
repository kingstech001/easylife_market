"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, PencilLine, Star } from "lucide-react";

export interface StoreReviewItem {
  id: string;
  userId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

interface StoreReviewStats {
  averageRating: number;
  reviewCount: number;
}

interface StoreReviewsSectionProps {
  storeSlug: string;
  initialReviews: StoreReviewItem[];
  initialStats: StoreReviewStats;
}

function formatReviewDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function StoreReviewsSection({
  storeSlug,
  initialReviews,
  initialStats,
}: StoreReviewsSectionProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [stats, setStats] = useState(initialStats);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratingLabel = useMemo(() => {
    if (stats.reviewCount === 0) {
      return "No ratings yet";
    }
    return `${stats.averageRating.toFixed(1)} average rating`;
  }, [stats]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!rating) {
      toast.error("Select a star rating before submitting your review.");
      return;
    }

    if (comment.trim().length < 10) {
      toast.error("Write at least 10 characters so your review is helpful.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/stores/${storeSlug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "review",
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Could not save your review.");
        return;
      }

      const nextReview = data.review as StoreReviewItem;

      setReviews((current) => {
        const withoutExisting = current.filter(
          (review) => review.userId !== nextReview.userId
        );
        return [nextReview, ...withoutExisting].slice(0, 10);
      });
      setStats(data.stats);
      setComment("");
      setRating(0);
      toast.success(data.message || "Review saved successfully.");
    } catch {
      toast.error("Something went wrong while saving your review.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-10 sm:mt-12">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[30px] border border-border/70 bg-background/90 shadow-sm">
          <CardContent className="p-5 pt-5 sm:p-6 sm:pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e1a200]/12 text-[#8c6500]">
                <PencilLine className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6500]">
                  Leave a review
                </p>
                <h3 className="mt-2 text-xl font-semibold text-foreground">
                  Share your experience with this store
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Logged-in users can rate the store and help other shoppers make better decisions.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Your rating</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="rounded-full p-1.5 transition hover:bg-[#e1a200]/10"
                      aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`h-6 w-6 ${
                          value <= rating
                            ? "fill-[#e1a200] text-[#e1a200]"
                            : "text-muted-foreground/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Your review</p>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell other shoppers what stood out about this store..."
                  className="min-h-[140px] rounded-2xl border-border/70 bg-background px-4 py-3 text-sm leading-6"
                  maxLength={500}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {comment.trim().length}/500 characters
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-full px-6 text-white hover:bg-[#c89100]"
              >
                {isSubmitting ? "Submitting..." : "Submit review"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[30px] border border-border/70 bg-background/90 shadow-sm">
          <CardContent className="p-5 pt-5 sm:p-6 sm:pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6500]">
                  Customer reviews
                </p>
                <h3 className="mt-2 text-xl font-semibold text-foreground">
                  What shoppers are saying
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {ratingLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground">
                  <Star className="mr-1.5 h-3.5 w-3.5 fill-[#e1a200] text-[#e1a200]" />
                  {stats.reviewCount > 0 ? stats.averageRating.toFixed(1) : "New"}
                </Badge>
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">
                  {stats.reviewCount} review{stats.reviewCount === 1 ? "" : "s"}
                </Badge>
              </div>
            </div>

            {reviews.length > 0 ? (
              <div className="mt-5 space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-border/70 bg-muted/20 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{review.reviewerName}</p>
                        <div className="mt-1 flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={`h-4 w-4 ${
                                index < review.rating
                                  ? "fill-[#e1a200] text-[#e1a200]"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatReviewDate(review.updatedAt || review.createdAt)}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-dashed border-border bg-muted/20 p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e1a200]/10 text-[#8c6500]">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h4 className="mt-4 text-lg font-semibold text-foreground">No reviews yet</h4>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Be the first to share your experience and help others discover this store.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
