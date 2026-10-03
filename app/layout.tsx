import type { Metadata } from "next";
import { Open_Sans, Ubuntu } from "next/font/google";
import { AgentProvider } from "@/app/_components/agent-context";
import { AuthGate } from "@/app/_components/auth-gate";
import { UserProvider } from "@/app/_components/user-context";
import { AgentChat } from "@/app/components/AgentChat";
import "./globals.css";

const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "700"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Hub Małopolskich Innowacji",
  description:
    "Wyszukuj programy wsparcia, wydarzenia i partnerów rozwijających innowacyjną Małopolskę.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      className={`${ubuntu.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <UserProvider>
          <AgentProvider>
            <AuthGate>
              {children}
              <AgentChat />
            </AuthGate>
          </AgentProvider>
        </UserProvider>
      </body>
    </html>
  );
}
