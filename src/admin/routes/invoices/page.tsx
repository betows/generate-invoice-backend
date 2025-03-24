import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText } from "@medusajs/icons"
import { Heading } from "@medusajs/ui"
import InvoicesTable from "../../../ui-components/invoices/invoices-table"

const InvoicesPage = () => {
  return (
    <div className="p-8">
      <Heading level="h1">Invoices</Heading>
      <InvoicesTable />
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Invoices",
  icon: DocumentText,
})

export default InvoicesPage
