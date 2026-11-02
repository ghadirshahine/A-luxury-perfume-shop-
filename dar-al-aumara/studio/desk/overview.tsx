import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

type OverviewStats = {products: number; lowStock: number; orders: number; revenue: number}

const overviewQuery = `{
  "products": count(*[_type == "product"]),
  "lowStock": count(*[_type == "product" && stock <= 8]),
  "orders": count(*[_type == "order"]),
  "ordersData": *[_type == "order" && status in ["new", "processing", "shipped", "delivered"]]{"total": pricing.total}
}`

export function OverviewPane() {
  const client = useClient({apiVersion: '2026-02-01'})
  const [stats, setStats] = useState<OverviewStats>()

  useEffect(() => {
    let current = true
    const refresh = () => {
      client.fetch<OverviewStats & {ordersData: {total?: number}[]}>(overviewQuery).then((result) => {
        if (current) {
          setStats({
            products: result.products,
            lowStock: result.lowStock,
            orders: result.orders,
            revenue: result.ordersData.reduce((sum, order) => sum + (order.total ?? 0), 0),
          })
        }
      })
    }
    refresh()
    const subscription = client.listen('*[_type in ["product", "order"]]').subscribe(refresh)
    return () => {
      current = false
      subscription.unsubscribe()
    }
  }, [client])

  const metrics = [
    ['Products', stats?.products],
    ['Low stock', stats?.lowStock],
    ['Orders', stats?.orders],
    ['Revenue', stats ? `${stats.revenue.toFixed(3)} KWD` : undefined],
  ] as const

  return (
    <main dir="rtl" className="studio-overview">
      <p className="studio-overview__eyebrow">DAR AL-AUMARA · OVERVIEW</p>
      <h1>نظرة عامة</h1>
      <div className="studio-overview__grid">
        {metrics.map(([label, value]) => (
          <section key={label} className="studio-overview__metric">
            <div>{label}</div>
            <strong>{value ?? '...'}</strong>
          </section>
        ))}
      </div>
    </main>
  )
}