import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";

export default function HomePage() {
    return (
        <div className="min-h-screen flex flex-col bg-[#111111] text-[#F5F5F5] selection:bg-[#8B5CF6]/30 selection:text-white">
            <Navbar />
            <main className="flex-1 flex flex-col">
                <HeroSection />
            </main>
        </div>
    );
}
