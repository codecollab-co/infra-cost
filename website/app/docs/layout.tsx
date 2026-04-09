import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DocsSidebar, { DocsSidebarMobile } from "@/components/docs/DocsSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Complete documentation for infra-cost — the multi-cloud FinOps CLI tool.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <div className="pt-16 flex">
        <DocsSidebar />
        <main className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto px-6 py-10 lg:py-12">{children}</div>
        </main>
      </div>
      <DocsSidebarMobile />
      <Footer />
    </div>
  );
}
