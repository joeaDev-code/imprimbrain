import OrderDetailPage from "@/components/modules/order-detail-page";
import { requireCTPagePermission } from "@/lib/ct-page";
import { ctPath } from "@/lib/ct-paths";

export default async function CTOrderDetailPage({
  params,
}: {
  params: Promise<{
    role: string;
    id: string;
  }>;
}) {
  const user = await requireCTPagePermission("ORDERS_VIEW");
  const { id } = await params;

  return (
    <OrderDetailPage
      orderId={id}
      backHref={ctPath(user.role, "/prestations")}
    />
  );
}