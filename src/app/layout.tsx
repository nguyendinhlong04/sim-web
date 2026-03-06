import "./globals.css";
import PortalDebugProbe from "@/components/debug/PortalDebugProbe";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PortalDebugProbe />
        {children}
      </body>
    </html>
  );
}
