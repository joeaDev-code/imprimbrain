import "./globals.css";
import { Comfortaa } from "next/font/google";
import { Toaster } from "sonner";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-comfortaa",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Imprim'Brain",
  description: "Gestion intelligente pour imprimeries",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={comfortaa.variable}>
      <body>
        {children}

        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            classNames: {
              toast: "font-[var(--font-comfortaa)]",
            },
          }}
        />
      </body>
    </html>
  );
}