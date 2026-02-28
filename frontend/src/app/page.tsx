'use client';

import { useAuth } from "@/contexts/auth-context";
import { useSession } from "@/contexts/session-context";
import { AuthPage } from "@/components/auth/auth-page";
import { SessionDialog } from "@/components/session/session-dialog";
import { MainLayout } from "@/components/ide/main-layout";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { session, isConnecting } = useSession();

  // Show loading spinner while checking auth state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage />;
  }

  // Show session dialog if logged in but no active session
  if (!session) {
    return <SessionDialog />;
  }

  // Show connecting indicator when joining session
  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Connecting to session...</p>
        </div>
      </div>
    );
  }

  // Show the main IDE
  return <MainLayout />;
}
