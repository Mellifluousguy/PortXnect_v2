// app/layout.tsx
import type { Metadata } from "next";
import { JetBrains_Mono, Inter, Fira_Code } from "next/font/google";
import "./globals.css";
import ReduxProvider from "./providers/ReduxProvider";
import './fontAwesome';


const jetBrains = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fira = Fira_Code({ variable: "--font-fira", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PortXNect",
  description: "PortXNect is a next-gen developer-centric social platform that connects coders through portfolios, real-time collaboration, and interactive project sharing. Build your dev identity, showcase your work, and network with innovators worldwide.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        data-theme="dark"
        className={`${jetBrains.variable} ${inter.variable} ${fira.variable} antialiased`}
      >
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
