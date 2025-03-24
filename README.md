## 🛠️ Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=your-region
AWS_S3_BUCKET=your-bucket-name
```

Ensure the S3 bucket is configured for public access or proper permissions.

### 2. Enable the Subscriber

The subscriber is registered automatically via:

```typescript
export const config: SubscriberConfig = {
  event: "payment.captured",
}
```

Make sure Medusa is configured to load subscribers from `src/subscribers`.

### 3. Admin UI Integration

The custom `InvoicesTable` component must be added to the Medusa Admin panel in a route (e.g., `/app/invoices`). Use the `GET /admin/invoices` endpoint to fetch the data.

---

## 🔍 Notes

- The subscriber falls back to using the latest order associated with the `payment_collection_id` if `order_id` is not present in the payment.
- Invoices are generated only when a payment is captured, not just authorized.
- Admin UI uses plain `<a>` tags for compatibility with Medusa Admin (no Next.js Link).

---

## 🧪 Example Output

- **Invoice filename**:  
  `order-order_01JQ1PPVAT0HXTXKZDXF85GW09-1742748821223.pdf`

- **S3 public URL**:  
  `https://your-bucket.s3.your-region.amazonaws.com/order-order_01JQ1PPVAT0HXTXKZDXF85GW09-1742748821223.pdf`

---

## ✅ Future Improvements

- Save invoice metadata to a DB table (if needed)
- Add invoice download directly to the order details page
- Add pagination and sorting to the invoices page
- Support invoice regeneration manually

---

## 🧠 Summary

This is a lightweight, plug-and-play invoice generation solution for Medusa v2. It leverages existing Medusa events and tools like Puppeteer and S3 to create professional invoices without blocking the main order flow.
