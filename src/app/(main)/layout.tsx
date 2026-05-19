import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OnboardingGuard } from "@/components/OnboardingGuard";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <OnboardingGuard />
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">{children}</main>
      <Footer />
    </div>
  );
}
