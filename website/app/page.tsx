import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import Providers from "@/components/home/Providers";
import TerminalDemo from "@/components/home/TerminalDemo";
import QuickStart from "@/components/home/QuickStart";
import Stats from "@/components/home/Stats";
import UseCases from "@/components/home/UseCases";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <Providers />
        <TerminalDemo />
        <UseCases />
        <QuickStart />
      </main>
      <Footer />
    </div>
  );
}
