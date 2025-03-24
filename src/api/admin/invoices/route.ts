import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const bucket = process.env.AWS_S3_BUCKET
  const region = process.env.AWS_REGION

  const remoteQuery = req.scope.resolve("remoteQuery") as any

  try {
    const { Contents = [] } = await s3.send(new ListObjectsV2Command({ Bucket: bucket }))
    
    const invoicePromises = Contents
      .filter((obj) => obj.Key?.endsWith(".pdf"))
      .map(async (obj) => {
        const match = obj.Key!.match(/order-(.*)-(\d+)\.pdf/)
        if (!match) return null

        const [, orderId, timestampStr] = match
        const timestamp = parseInt(timestampStr)
        const url = `https://${bucket}.s3.${region}.amazonaws.com/${obj.Key}`

        try {
          const [order] = await remoteQuery({
            entryPoint: "order",
            variables: { id: orderId },
            fields: [
              "id",
              "display_id",
              "billing_address.first_name",
              "billing_address.last_name",
              "total",
              "shipping_total",
              "currency_code",
              "order_total",
              "total"
            ],
          })

          const customerName = `${order.billing_address?.first_name ?? ""} ${order.billing_address?.last_name ?? ""}`.trim()
          const total = Number(order.total) + Number(order.shipping_total)
          const currency = order.currency_code?.toUpperCase() ?? ""

          return {
            invoice_id: `inv-${order.display_id}-${timestamp}`,
            order_id: order.id,
            display_id: order.display_id,
            customer_name: customerName,
            total: `${total.toFixed(2)} ${currency}`,
            timestamp,
            url,
          }
        } catch (err) {
          console.warn(`Failed to fetch order ${orderId}:`, err.message)
          return null
        }
      })

    const invoices = (await Promise.all(invoicePromises)).filter(Boolean)

    res.status(200).json({ invoices })
  } catch (err) {
    console.error("Failed to fetch invoices from S3", err)
    res.status(500).json({ error: "Failed to load invoices" })
  }
}
