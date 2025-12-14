// lib/paymentLogger.ts
import { connectToDB } from "@/lib/db";
import mongoose from "mongoose";

// Payment audit log schema
const PaymentAuditSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  event: {
    type: String,
    required: true,
    enum: [
      // Existing events
      "verification_started",
      "verification_success",
      "verification_failed",
      "amount_mismatch",
      "duplicate_detected",
      "order_created",
      "webhook_received",
      "rate_limit_hit",

      // ✅ ADD THESE NEW WEBHOOK EVENTS
      "webhook_charge_success",
      "webhook_charge_failed",
      "webhook_amount_mismatch",
      "webhook_processing_failed",
      "webhook_critical_error",
      "webhook_invalid_signature",
      "webhook_rate_limit_hit",
      "webhook_order_created",
      "duplicate_order_updated",
      "subscription_updated",
      "subscription_failed",
    ],
  },
  amount: Number,
  expectedAmount: Number,
  metadata: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  error: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// TTL index - automatically delete logs older than 90 days
PaymentAuditSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

const PaymentAudit =
  mongoose.models.PaymentAudit ||
  mongoose.model("PaymentAudit", PaymentAuditSchema);

export interface AuditLogData {
  reference: string;
  userId?: string;
  event: string;
  amount?: number;
  expectedAmount?: number;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  error?: string;
}

export class PaymentLogger {
  static async log(data: AuditLogData) {
    try {
      await connectToDB();
      await PaymentAudit.create({
        ...data,
        timestamp: new Date(),
      });
    } catch (error) {
      // Don't throw errors from logging - just console log
      console.error("Failed to write audit log:", error);
    }
  }

  static async getAuditTrail(reference: string) {
    try {
      await connectToDB();
      return await PaymentAudit.find({ reference })
        .sort({ timestamp: -1 })
        .lean();
    } catch (error) {
      console.error("Failed to retrieve audit trail:", error);
      return [];
    }
  }

  static async getSuspiciousActivity(hours: number = 24) {
    try {
      await connectToDB();
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const [
        amountMismatches,
        rateLimitHits,
        verificationFailures,
        webhookErrors,
      ] = await Promise.all([
        PaymentAudit.countDocuments({
          event: { $in: ["amount_mismatch", "webhook_amount_mismatch"] },
          timestamp: { $gte: since },
        }),
        PaymentAudit.countDocuments({
          event: { $in: ["rate_limit_hit", "webhook_rate_limit_hit"] },
          timestamp: { $gte: since },
        }),
        PaymentAudit.countDocuments({
          event: "verification_failed",
          timestamp: { $gte: since },
        }),
        PaymentAudit.countDocuments({
          event: {
            $in: ["webhook_processing_failed", "webhook_critical_error"],
          },
          timestamp: { $gte: since },
        }),
      ]);

      return {
        period: `Last ${hours} hours`,
        amountMismatches,
        rateLimitHits,
        verificationFailures,
        webhookErrors,
        totalSuspiciousEvents:
          amountMismatches +
          rateLimitHits +
          verificationFailures +
          webhookErrors,
      };
    } catch (error) {
      console.error("Failed to get suspicious activity:", error);
      return null;
    }
  }

  static async getRecentFailures(limit: number = 10) {
    try {
      await connectToDB();
      return await PaymentAudit.find({
        event: {
          $in: [
            "verification_failed",
            "amount_mismatch",
            "webhook_amount_mismatch",
            "webhook_processing_failed",
            "webhook_critical_error",
          ],
        },
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      console.error("Failed to get recent failures:", error);
      return [];
    }
  }

  // ✅ NEW: Get webhook processing stats
  static async getWebhookStats(hours: number = 24) {
    try {
      await connectToDB();
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const [successful, failed, amountMismatches, criticalErrors] =
        await Promise.all([
          PaymentAudit.countDocuments({
            event: "webhook_charge_success",
            timestamp: { $gte: since },
          }),
          PaymentAudit.countDocuments({
            event: "webhook_charge_failed",
            timestamp: { $gte: since },
          }),
          PaymentAudit.countDocuments({
            event: "webhook_amount_mismatch",
            timestamp: { $gte: since },
          }),
          PaymentAudit.countDocuments({
            event: "webhook_critical_error",
            timestamp: { $gte: since },
          }),
        ]);

      return {
        period: `Last ${hours} hours`,
        successful,
        failed,
        amountMismatches,
        criticalErrors,
        successRate:
          successful > 0
            ? ((successful / (successful + failed)) * 100).toFixed(2)
            : "0",
      };
    } catch (error) {
      console.error("Failed to get webhook stats:", error);
      return null;
    }
  }
}

// Alert thresholds
const ALERT_THRESHOLDS = {
  AMOUNT_MISMATCHES_PER_HOUR: 5,
  RATE_LIMIT_HITS_PER_HOUR: 20,
  VERIFICATION_FAILURES_PER_HOUR: 10,
  WEBHOOK_ERRORS_PER_HOUR: 15,
};

export async function checkForAlerts() {
  const activity = await PaymentLogger.getSuspiciousActivity(1);

  if (!activity) return null;

  const alerts = [];

  if (
    activity.amountMismatches >= ALERT_THRESHOLDS.AMOUNT_MISMATCHES_PER_HOUR
  ) {
    alerts.push({
      type: "CRITICAL",
      message: `⚠️ ${activity.amountMismatches} amount mismatches in the last hour`,
      recommendation: "Investigate possible price manipulation attempts",
    });
  }

  if (activity.rateLimitHits >= ALERT_THRESHOLDS.RATE_LIMIT_HITS_PER_HOUR) {
    alerts.push({
      type: "WARNING",
      message: `⚠️ ${activity.rateLimitHits} rate limit hits in the last hour`,
      recommendation: "Possible automated attack or bot activity",
    });
  }

  if (
    activity.verificationFailures >=
    ALERT_THRESHOLDS.VERIFICATION_FAILURES_PER_HOUR
  ) {
    alerts.push({
      type: "WARNING",
      message: `⚠️ ${activity.verificationFailures} verification failures in the last hour`,
      recommendation: "Check Paystack integration and network connectivity",
    });
  }

  // ✅ NEW: Alert for webhook errors
  if (activity.webhookErrors >= ALERT_THRESHOLDS.WEBHOOK_ERRORS_PER_HOUR) {
    alerts.push({
      type: "CRITICAL",
      message: `⚠️ ${activity.webhookErrors} webhook processing errors in the last hour`,
      recommendation:
        "Check webhook handler, database connection, and transaction management",
    });
  }

  return alerts.length > 0 ? alerts : null;
}
