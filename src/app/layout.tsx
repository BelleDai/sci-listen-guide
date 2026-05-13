import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-JCSL79SFSD";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "科學好好聽｜科普伴讀",
  description: "「科學好好聽」是一個為學齡兒童與家庭打造的中文科普 Podcast，主持人 Kyle Huang 運用 AI 技術以故事音效呈現冰河、雪花、侵蝕、U 形谷、角峰等冰河地形，洞穴、鐘乳石、石筍、滲穴和地殼運動等喀斯特探險，以及水文循環、海洋、湖泊、淡水、地下水、河流與冰河。節目還深入探討颱風、颶風、熱帶氣旋、颱風眼、眼牆、強風、豪雨、風暴潮、防災與全球暖化，以及地震的 P 波、S 波、板塊運動、火環與火山等地球科學知識，在每集節目中，孩子與大人都能輕鬆了解科學概念，啟發好奇心與學習熱情。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { send_page_view: true });
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
