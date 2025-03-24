import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import puppeteer from "puppeteer"
import BigNumber from "bignumber.js"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import uuid from "uuid"

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export default async function handler({ event, container }: SubscriberArgs<{ id: string }>) {
  const paymentId = event.data.id
  if (!paymentId) return

  try {
    const remoteQuery = container.resolve("remoteQuery") as any
    const [payment] = await remoteQuery({
      entryPoint: "payment",
      variables: { id: paymentId },
      fields: ["id", "order_id", "payment_collection_id"]
    })

    let orderId = payment?.order_id

    // Only try fallback if order_id is not defined
    if (!orderId && payment?.payment_collection_id) {
        const orders = await remoteQuery({
            entryPoint: "order",
            variables: { payment_collection_id: payment.payment_collection_id },
            fields: [
              "id",
              "payment_collections.id",
              "payment_collections.payments.id"
            ]
          })
          
          for (const order of orders) {
            for (const collection of order.payment_collections || []) {
              if (collection.payments.some((p: any) => p.id === paymentId)) {
                orderId = order.id
                break
              }
            }
            if (orderId) break
          }          
    }

    if (!orderId) return

    const [order] = await remoteQuery({
      entryPoint: "order",
      variables: { id: orderId },
      fields: [
        "id", "display_id", "currency_code", "total", "shipping_total", "created_at",
        "customer.email", "billing_address.first_name", "billing_address.last_name",
        "billing_address.address_1", "billing_address.city", "billing_address.postal_code",
        "billing_address.country_code", "items.title", "items.quantity", "items.unit_price",
        "items.variant.title", "items.variant.product.title"
      ]
    })

    const currency = order.currency_code.toUpperCase()
    const total = new BigNumber(order.total).toFixed(2)
    const shipping = new BigNumber(order.shipping_total).toFixed(2)
    const totalWithShipping = new BigNumber(total).plus(shipping).toFixed(2)
    const date = new Date(order.created_at).toLocaleDateString()
    const timestamp = Date.now()
    const invoiceFileName = `order-${order.id}-${timestamp}.pdf`
    const invoiceId = `inv-${order.display_id}-${timestamp}`

    const billing = order.billing_address || {}
    const customerName = `${billing.first_name ?? ""} ${billing.last_name ?? ""}`.trim()

    const html = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            h1 { color: #333; }
            .info { margin-bottom: 20px; }
            ul { padding-left: 0; list-style: none; }
            li { margin: 8px 0; }
            .total { margin-top: 20px; font-size: 1.2em; }
          </style>
        </head>
        <body>
            <p><strong>Invoice ID:</strong> ${invoiceId}</p>
          <div style="display: flex; flex-direction: row;">
            <p><strong>Invoice to order :</p></strong> <p>${order.id}</p>
          </div>
          <div class="info">
            <p><strong>Store:</strong> Test store</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Customer:</strong> ${order.customer?.email ?? "N/A"}</p>
            <p><strong>Name:</strong> ${customerName || "N/A"}</p>
            <p><strong>Address:</strong> ${billing.address_1 ?? ""}, ${billing.city ?? ""}, ${billing.postal_code ?? ""}, ${billing.country_code?.toUpperCase() ?? ""}</p>
          </div>
          <ul>
            ${order.items.map(item => {
              const name = item.variant?.product?.title || item.title || "Unnamed Product"
              const price = new BigNumber(item.unit_price).toFixed(2)
              return `<li>${name} (${order.items.length}x) - ${price} ${currency} each</li>`
            }).join("")}
          </ul>
          <div class="total"><strong>Shipping:</strong> ${shipping} ${currency}</div>
          <div class="total"><strong>Total:</strong> ${totalWithShipping} ${currency}</div>
        </body>
      </html>
    `

    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })
    const pdfBuffer = await page.pdf({ format: "A4" })
    await browser.close()

    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: invoiceFileName,
      Body: pdfBuffer,
      ContentType: "application/pdf",
    }))

    console.log(`Invoice uploaded to S3: ${invoiceFileName}`)
  } catch (err) {
    console.error("Error generating/uploading invoice:", err)
  }
}

export const config: SubscriberConfig = {
  event: "payment.captured",
}
