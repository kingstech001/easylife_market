// lib/paymentLogger.ts
import { connectToDB } from "@/lib/db"
import mongoose from "mongoose"

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
      "verification_started",
      "verification_success",
      "verification_failed",
      "amount_mismatch",
      "duplicate_detected",
      "order_created",
      "webhook_received",
      "rate_limit_hit",
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
})

// TTL index - automatically delete logs older than 90 days
PaymentAuditSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 })

const PaymentAudit =
  mongoose.models.PaymentAudit ||
  mongoose.model("PaymentAudit", PaymentAuditSchema)

export interface AuditLogData {
  reference: string
  userId?: string
  event: string
  amount?: number
  expectedAmount?: number
  metadata?: any
  ipAddress?: string
  userAgent?: string
  error?: string
}

export class PaymentLogger {
  static async log(data: AuditLogData) {
    try {
      await connectToDB()
      await PaymentAudit.create({
        ...data,
        timestamp: new Date(),
      })
    } catch (error) {
      // Don't throw errors from logging - just console log
      console.error("Failed to write audit log:", error)
    }
  }

  static async getAuditTrail(reference: string) {
    try {
      await connectToDB()
      return await PaymentAudit.find({ reference })
        .sort({ timestamp: -1 })
        .lean()
    } catch (error) {
      console.error("Failed to retrieve audit trail:", error)
      return []
    }
  }

  static async getSuspiciousActivity(hours: number = 24) {
    try {
      await connectToDB()
      const since = new Date(Date.now() - hours * 60 * 60 * 1000)

      const [amountMismatches, rateLimitHits, verificationFailures] =
        await Promise.all([
          PaymentAudit.countDocuments({
            event: "amount_mismatch",
            timestamp: { $gte: since },
          }),
          PaymentAudit.countDocuments({
            event: "rate_limit_hit",
            timestamp: { $gte: since },
          }),
          PaymentAudit.countDocuments({
            event: "verification_failed",
            timestamp: { $gte: since },
          }),
        ])

      return {
        period: `Last ${hours} hours`,
        amountMismatches,
        rateLimitHits,
        verificationFailures,
        totalSuspiciousEvents:
          amountMismatches + rateLimitHits + verificationFailures,
      }
    } catch (error) {
      console.error("Failed to get suspicious activity:", error)
      return null
    }
  }

  static async getRecentFailures(limit: number = 10) {
    try {
      await connectToDB()
      return await PaymentAudit.find({
        event: { $in: ["verification_failed", "amount_mismatch"] },
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean()
    } catch (error) {
      console.error("Failed to get recent failures:", error)
      return []
    }
  }
}

// Alert thresholds
const ALERT_THRESHOLDS = {
  AMOUNT_MISMATCHES_PER_HOUR: 5,
  RATE_LIMIT_HITS_PER_HOUR: 20,
  VERIFICATION_FAILURES_PER_HOUR: 10,
}

export async function checkForAlerts() {
  const activity = await PaymentLogger.getSuspiciousActivity(1)

  if (!activity) return null

  const alerts = []

  if (activity.amountMismatches >= ALERT_THRESHOLDS.AMOUNT_MISMATCHES_PER_HOUR) {
    alerts.push({
      type: "CRITICAL",
      message: `⚠️ ${activity.amountMismatches} amount mismatches in the last hour`,
      recommendation: "Investigate possible price manipulation attempts",
    })
  }

  if (activity.rateLimitHits >= ALERT_THRESHOLDS.RATE_LIMIT_HITS_PER_HOUR) {
    alerts.push({
      type: "WARNING",
      message: `⚠️ ${activity.rateLimitHits} rate limit hits in the last hour`,
      recommendation: "Possible automated attack or bot activity",
    })
  }

  if (
    activity.verificationFailures >=
    ALERT_THRESHOLDS.VERIFICATION_FAILURES_PER_HOUR
  ) {
    alerts.push({
      type: "WARNING",
      message: `⚠️ ${activity.verificationFailures} verification failures in the last hour`,
      recommendation: "Check Paystack integration and network connectivity",
    })
  }

  return alerts.length > 0 ? alerts : null
}