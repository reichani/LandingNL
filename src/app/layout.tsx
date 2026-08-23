import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LandingNL — Your student landing plan for the Netherlands",
    template: "%s · LandingNL",
  },
  description: "Housing, municipality registration, BSN, DigiD, money, documents and part-time work in one calm international-student landing plan for the Netherlands.",
  applicationName: "LandingNL",
  keywords: ["Netherlands students", "BSN", "DigiD", "municipality registration", "student housing", "DUO", "international students Netherlands"],
  openGraph: {
    title: "LandingNL — Your move, in the right order.",
    description: "A calm landing plan for international students moving to the Netherlands.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
