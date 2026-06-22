import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StyledJsxRegistry from "./registry";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RAG PDF Chatbot - AI-Powered Document Q&A",
  description:
    "Upload PDF documents and chat with AI to get instant answers. Powered by RAG (Retrieval Augmented Generation), Gemini AI, and Pinecone vector database.",
};

// Runs before first paint to set the theme from localStorage or the OS
// preference, so there is no flash of the wrong theme on load.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <StyledJsxRegistry>{children}</StyledJsxRegistry>
      </body>
    </html>
  );
}
