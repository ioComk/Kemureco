// ルートレイアウト: next-intl の [locale] ルートに委譲するため最小限の構成
// 実際のレイアウトは src/app/[locale]/layout.tsx で定義される
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
