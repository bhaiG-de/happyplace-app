import type { Metadata } from "next";
// Removed Geist fonts, using Inter and JetBrains Mono defined in Tailwind config
import "./globals.css";
import { cn } from "@/lib/utils"; // Import cn utility
import { Header } from "@/components/core/Header"; // Import Header
// import { Toaster } from "@/components/ui/toaster" // OLD import
import { Toaster as Sonner } from "@/components/ui/sonner" // NEW import
import { ThemeProvider } from "@/components/theme-provider"
// import { WebContainerProvider } from "@/context/WebContainerContext"; // Import the provider -> REMOVED
// import { AstRegistryProvider } from "@/context/AstRegistryContext"; // Keep AST Provider -> REMOVED

// We'll rely on the font families defined in tailwind.config.ts
// const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
// const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  // Updated title and description
  title: "Happyplace App",
  description: "A next-generation IDE POC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          // Use font variables defined in tailwind.config.ts indirectly via globals.css or direct application
          // Add specific font variables here if needed, e.g. inter.variable, jetbrainsMono.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* <WebContainerProvider> -> REMOVED */}
            {/* <AstRegistryProvider> -> REMOVED */}
            <div className="relative flex min-h-screen flex-col">
              <Header /> { /* Use the actual Header component */}
              <main className="flex-1 container py-6">{children}</main>
            </div>
            {/* </AstRegistryProvider> -> REMOVED */}
          {/* </WebContainerProvider> -> REMOVED */}
          {/* <Toaster /> -> OLD */}
          <Sonner /> {/* NEW */} 
        </ThemeProvider>
      </body>
    </html>
  );
}
