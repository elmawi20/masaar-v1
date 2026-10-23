import type { Metadata } from 'next';
import './globals.css';
import { ClinicProvider } from '@/context/ClinicContext';

export const metadata: Metadata = {
  title: 'PhysioFlow - Multi-Tenant Physiotherapy Clinic Management SaaS',
  description:
    'Modern, 100% free-tier cloud SaaS for Physiotherapy Centers, Sports Rehab Clinics, and Allied Health Practices.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-x-hidden" suppressHydrationWarning>
        <ClinicProvider>{children}</ClinicProvider>
      </body>
    </html>
  );
}
