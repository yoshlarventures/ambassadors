import { Trophy } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            <span className="font-semibold text-lg">Startup Ambassadors</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center py-12">
        {children}
      </main>
    </div>
  );
}
