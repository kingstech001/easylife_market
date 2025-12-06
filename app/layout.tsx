// / app/layout.tsx (Root Layout)
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { CartProvider } from "@/context/cart-context";
import { WishlistProvider } from "@/context/wishlist-context";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LocationPrompt } from "@/components/location-prompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EasyLife",
  description: "Build and customize your own e-commerce store with EasyLife",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className ?? ""}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <WishlistProvider>
              <CartProvider>
                <LocationPrompt />
                {children}
                <Toaster position="bottom-right" richColors />
              </CartProvider>
            </WishlistProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}