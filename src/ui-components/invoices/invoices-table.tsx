import { Table, Input } from "@medusajs/ui"
import { useEffect, useState } from "react"

type Invoice = {
  invoice_id: string
  order_id: string
  display_id: number
  customer_name: string
  total: string
  date: string
  url: string
  order_total: string
  shipping_total: string
}

const InvoicesTable = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/admin/invoices", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.invoices.map((inv: any) => ({
          invoice_id: inv.invoice_id,
          order_id: inv.order_id,
          display_id: inv.display_id,
          customer_name: inv.customer_name,
          total: inv.total,
          date: new Date(inv.timestamp).toLocaleString(),
          url: inv.url,
        }))
        setInvoices(formatted)
      })
  }, [])

  const filtered = invoices.filter(
    (inv) =>
      inv.invoice_id?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4 py-4">
      <Input
        placeholder="Search by Invoice ID or Customer Name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="py-2"
      />

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Invoice ID</Table.HeaderCell>
            <Table.HeaderCell>Order ID</Table.HeaderCell>
            <Table.HeaderCell>Customer</Table.HeaderCell>
            <Table.HeaderCell>Total</Table.HeaderCell>
            <Table.HeaderCell>Date</Table.HeaderCell>
            <Table.HeaderCell>View</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body className="mt-4">
          {filtered.length === 0 ? (
            <Table.Row>
              <td colSpan={6}>No invoices found</td>
            </Table.Row>
          ) : (
            filtered.map((inv, idx) => (
              <Table.Row key={idx}>
                <Table.Cell>{inv.invoice_id}</Table.Cell>
                <Table.Cell>
                <a
                href={`/app/orders/${inv.order_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
                >
                #{inv.display_id}
                </a>
                </Table.Cell>
                <Table.Cell>{inv.customer_name}</Table.Cell>
                <Table.Cell>{inv.total}</Table.Cell>
                <Table.Cell>{inv.date}</Table.Cell>
                <Table.Cell>
                  <a
                    href={inv.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    View
                  </a>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </div>
  )
}

export default InvoicesTable
