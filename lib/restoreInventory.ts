// lib/restoreInventory.ts
// Add this utility function to restore inventory when orders are cancelled or refunded

import mongoose from "mongoose"
import Order from "@/models/Order"
import Product from "@/models/Product"
import { connectToDB } from "@/lib/db"
import { PaymentLogger } from "@/lib/paymentLogger"

/**
 * Restore inventory for a cancelled or refunded order
 * @param orderId - The order ID to restore inventory for
 * @param reason - Reason for restoration (e.g., "Order cancelled", "Payment refunded")
 */
export async function restoreInventoryForOrder(
  orderId: string,
  reason: string = "Order cancelled"
) {
  const session = await mongoose.startSession()
  
  try {
    await connectToDB()
    session.startTransaction()

    // Find the order
    const order = await Order.findById(orderId).session(session)

    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }

    // Only restore for cancelled or refunded orders
    if (order.status !== "cancelled" && order.paymentStatus !== "refunded") {
      console.log(
        `⚠️ Order ${orderId} is not cancelled or refunded. ` +
        `Status: ${order.status}, Payment: ${order.paymentStatus}`
      )
      await session.abortTransaction()
      return {
        success: false,
        message: "Order is not cancelled or refunded",
        orderId,
      }
    }

    const restorationResults = []
    const errors = []

    // Restore inventory for each item
    for (const item of order.items) {
      try {
        // Get current product state
        const productBefore = await Product.findById(item.productId)
          .session(session)
          .lean()

        if (!productBefore) {
          errors.push({
            productId: item.productId.toString(),
            productName: item.productName,
            error: "Product not found",
          })
          continue
        }

        // Restore the inventory
        const updatedProduct = await Product.findByIdAndUpdate(
          item.productId,
          { 
            $inc: { inventoryQuantity: item.quantity }
          },
          { 
            session,
            new: true,
          }
        )

        if (!updatedProduct) {
          throw new Error(`Failed to restore inventory for ${item.productName}`)
        }

        restorationResults.push({
          productId: item.productId.toString(),
          productName: item.productName,
          quantityRestored: item.quantity,
          previousQuantity: productBefore.inventoryQuantity,
          newQuantity: updatedProduct.inventoryQuantity,
        })

        console.log(
          `✅ Inventory restored: ${item.productName} | ` +
          `${productBefore.inventoryQuantity} → ${updatedProduct.inventoryQuantity} | ` +
          `Restored: ${item.quantity}`
        )

        // If product was deactivated due to low stock, optionally reactivate it
        if (!productBefore.isActive && updatedProduct.inventoryQuantity > 0) {
          await Product.findByIdAndUpdate(
            item.productId,
            { 
              isActive: true,
              deactivatedAt: null,
            },
            { session }
          )
          
          console.log(`✅ Product reactivated: ${item.productName}`)
        }

      } catch (error: any) {
        console.error(
          `❌ Error restoring inventory for ${item.productName}:`,
          error
        )
        
        errors.push({
          productId: item.productId.toString(),
          productName: item.productName,
          error: error.message,
        })
      }
    }

    // If there were errors, rollback
    if (errors.length > 0) {
      await session.abortTransaction()
      
      await PaymentLogger.log({
        reference: order.reference,
        event: "inventory_restoration_failed",
        error: `Failed to restore inventory for ${errors.length} items`,
        metadata: { orderId, errors },
      })

      return {
        success: false,
        orderId,
        message: "Failed to restore inventory for some items",
        errors,
        restorationResults,
      }
    }

    // Commit the transaction
    await session.commitTransaction()

    // Log successful restoration
    await PaymentLogger.log({
      reference: order.reference,
      event: "inventory_restored_successfully",
      metadata: {
        orderId,
        reason,
        restorationResults: restorationResults.map(r => ({
          productName: r.productName,
          restored: r.quantityRestored,
          newQuantity: r.newQuantity,
        })),
        totalItemsRestored: restorationResults.length,
      },
    })

    console.log(
      `📊 Inventory Restoration Summary for Order ${orderId}:\n` +
      `   - Products restored: ${restorationResults.length}\n` +
      `   - Total quantity restored: ${restorationResults.reduce((sum, r) => sum + r.quantityRestored, 0)}\n` +
      `   - Reason: ${reason}`
    )

    return {
      success: true,
      orderId,
      message: "Inventory restored successfully",
      restorationResults,
      totalItemsRestored: restorationResults.length,
    }

  } catch (error: any) {
    await session.abortTransaction()
    console.error(`❌ Error restoring inventory for order ${orderId}:`, error)
    
    throw error
  } finally {
    session.endSession()
  }
}

/**
 * Add this to your webhook to handle refunds
 */
export async function handleRefundWebhook(reference: string) {
  try {
    await connectToDB()

    // Find all orders with this reference
    const orders = await Order.find({ reference })

    if (orders.length === 0) {
      console.log(`⚠️ No orders found for reference: ${reference}`)
      return
    }

    // Update payment status to refunded
    await Order.updateMany(
      { reference },
      { 
        paymentStatus: "refunded",
        status: "cancelled",
      }
    )

    // Restore inventory for each order
    for (const order of orders) {
      await restoreInventoryForOrder(
        order._id.toString(),
        "Payment refunded"
      )
    }

    console.log(
      `✅ Refund processed and inventory restored for ${orders.length} orders`
    )

  } catch (error) {
    console.error(`❌ Error handling refund for ${reference}:`, error)
    throw error
  }
}