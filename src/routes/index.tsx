import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const SupplyFlow = lazy(() => import("@/components/supplyflow/SupplyFlow"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SupplyFlow SCM" },
      { name: "description", content: "SupplyFlow — aplikasi Supply Chain Management: supplier, produk, gudang, pembelian, penjualan, dan pengiriman." },
      { property: "og:title", content: "SupplyFlow SCM" },
      { property: "og:description", content: "Kelola rantai pasok dari supplier hingga pengiriman dalam satu sistem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly fallback={null}>
      <Suspense fallback={null}>
        <SupplyFlow />
      </Suspense>
    </ClientOnly>
  );
}
