import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "infra-cost — Multi-Cloud FinOps CLI",
    template: "%s | infra-cost",
  },
  description:
    "Open-source CLI tool for comprehensive cloud cost analysis, forecasting, and optimization across AWS, GCP, Azure, and more. Take control of your cloud costs.",
  keywords: [
    "cloud cost optimization",
    "finops",
    "aws cost analysis",
    "gcp cost",
    "azure cost",
    "multi-cloud",
    "infra-cost",
    "cli tool",
    "devops",
    "cloud cost management",
  ],
  authors: [{ name: "CodeCollab", url: "https://codecollab.co" }],
  creator: "CodeCollab",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://infra-cost.codecollab.co",
    title: "infra-cost — Multi-Cloud FinOps CLI",
    description:
      "Take control of your cloud costs. Analyze, forecast, and optimize spending across AWS, GCP, Azure and more with a single CLI tool.",
    siteName: "infra-cost",
  },
  twitter: {
    card: "summary_large_image",
    title: "infra-cost — Multi-Cloud FinOps CLI",
    description:
      "Take control of your cloud costs. Analyze, forecast, and optimize spending across AWS, GCP, Azure and more.",
    creator: "@codecollabco",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} scroll-smooth`}
    >
      <body className="bg-bg-primary text-text-primary antialiased">{children}</body>
    </html>
  );
}
