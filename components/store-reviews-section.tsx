"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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

const INITIAL_VISIBLE = 3;
const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E5A43]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

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

// Read-only stars (rounded to the nearest whole star)
function Stars({ value, className }: { value: number; className?: string }) {
  const filled = Math.round(value);
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={cn(
            "h-4 w-4",
            n <= filled
              ? "fill-[#F4C430] text-[#F4C430]"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </span>
  );
}

export function StoreReviewsSection({
  storeSlug,
  initialReviews,
  initialStats,
}: StoreReviewsSectionProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [stats, setStats] = useState(initialStats);
  const [formOpen, setFormOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shownRating = hoverRating || rating;
  const visibleReviews = showAll ? reviews : reviews.slice(0, INITIAL_VISIBLE);
  const hiddenCount = reviews.length - visibleReviews.length;

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
          (review) => review.userId !== nextReview.userId,
        );
        return [nextReview, ...withoutExisting].slice(0, 10);
      });
      setStats(data.stats);
      setComment("");
      setRating(0);
      setHoverRating(0);
      setFormOpen(false);
      toast.success(data.message || "Review saved successfully.");
    } catch {
      toast.error("Something went wrong while saving your review.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="reviews-heading" className="mt-10 sm:mt-12">
      {/* Summary + action */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border pb-4">
        <div>
          <h2
            id="reviews-heading"
            className="text-xl font-semibold tracking-tight text-foreground"
          >
            Reviews
          </h2>
          <div className="mt-1.5 flex items-center gap-2 text-sm">
            {stats.reviewCount > 0 ? (
              <>
                <span className="text-lg font-semibold tabular-nums text-foreground">
                  {stats.averageRating.toFixed(1)}
                </span>
                <Stars value={stats.averageRating} />
                <span className="text-muted-foreground">
                  ({stats.reviewCount} review{stats.reviewCount === 1 ? "" : "s"})
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">No reviews yet</span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFormOpen((open) => !open)}
          aria-expanded={formOpen}
          aria-controls="review-form"
          className={cn(
            "inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted",
            focusRing,
          )}
        >
          {formOpen ? "Cancel" : "Write a review"}
        </button>
      </div>

      {/* Write a review (collapsed by default, keeps the section short) */}
      <div
        id="review-form"
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          formOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden" aria-hidden={!formOpen}>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 border-b border-border py-5"
          >
            <div>
              <p className="mb-1.5 text-sm font-medium text-foreground">
                Your rating
              </p>
              <div className="flex items-center gap-3">
                <div
                  role="radiogroup"
                  aria-label="Your rating"
                  className="flex items-center"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={rating === value}
                      aria-label={`${value} star${value > 1 ? "s" : ""}`}
                      tabIndex={formOpen ? 0 : -1}
                      onClick={() => setRating(value)}
                      onMouseEnter={() => setHoverRating(value)}
                      className={cn("rounded p-1", focusRing)}
                    >
                      <Star
                        className={cn(
                          "h-6 w-6 transition-colors",
                          value <= shownRating
                            ? "fill-[#F4C430] text-[#F4C430]"
                            : "text-muted-foreground/40",
                        )}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground" aria-live="polite">
                  {RATING_LABELS[shownRating]}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="review-comment"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Your review
              </label>
              <Textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What stood out about this store?"
                className="min-h-[96px] rounded-lg border-border bg-background px-3.5 py-2.5 text-base leading-6 shadow-none focus-visible:border-[#0E5A43] focus-visible:ring-4 focus-visible:ring-[#0E5A43]/10 focus-visible:ring-offset-0 sm:text-sm"
                maxLength={500}
                tabIndex={formOpen ? 0 : -1}
              />
              <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  You need to be signed in. A new review replaces your earlier one.
                </span>
                <span className="shrink-0 tabular-nums">
                  {comment.trim().length}/500
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              tabIndex={formOpen ? 0 : -1}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-lg bg-[#0E5A43] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#083B2D] disabled:cursor-not-allowed disabled:opacity-60",
                focusRing,
              )}
            >
              {isSubmitting ? "Submitting..." : "Submit review"}
            </button>
          </form>
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 ? (
        <>
          <ul className="divide-y divide-border">
            {visibleReviews.map((review) => (
              <li key={review.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {review.reviewerName}
                    </p>
                    <Stars value={review.rating} className="mt-1 [&>svg]:h-3.5 [&>svg]:w-3.5" />
                  </div>
                  <time
                    dateTime={review.updatedAt || review.createdAt}
                    className="shrink-0 text-xs text-muted-foreground"
                  >
                    {formatReviewDate(review.updatedAt || review.createdAt)}
                  </time>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {review.comment}
                </p>
              </li>
            ))}
          </ul>

          {(hiddenCount > 0 || showAll) && reviews.length > INITIAL_VISIBLE && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className={cn(
                "mt-1 rounded text-sm font-medium text-[#0E5A43] underline-offset-4 hover:underline dark:text-emerald-400",
                focusRing,
              )}
            >
              {showAll ? "Show fewer" : `Show ${hiddenCount} more`}
            </button>
          )}
        </>
      ) : (
        <p className="py-6 text-sm text-muted-foreground">
          Be the first to share your experience with this store.
        </p>
      )}
    </section>
  );
}