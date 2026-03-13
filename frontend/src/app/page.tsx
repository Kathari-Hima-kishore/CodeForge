'use client';

import { useAuth } from "@/contexts/auth-context";
import { useSession } from "@/contexts/session-context";
import { AuthPage } from "@/components/auth/auth-page";
import { SessionDialog } from "@/components/session/session-dialog";
import { MainLayout } from "@/components/ide/main-layout";
import { Loader2, Terminal } from "lucide-react";

function FullScreenLoader({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl" />
          <div className="relative bg-gradient-to-br from-primary to-purple-600 p-3.5 rounded-2xl shadow-xl shadow-primary/20">
            <Terminal className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { session, isConnecting } = useSession();

  if (authLoading) return <FullScreenLoader message="Authenticating..." />;
  if (!user) return <AuthPage />;
  if (isConnecting) return <FullScreenLoader message="Connecting to session..." />;
  if (!session) return <SessionDialog />;
  return <MainLayout />;
}
