import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Weather Extension Backend',
  description: 'Weather Extension Backend',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
