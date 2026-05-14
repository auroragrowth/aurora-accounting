import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Nav } from "@/components/nav";
import { ToastProvider } from "@/components/toast-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <ToastProvider>
      <Header />
      <Nav />
      <main className="max-w-6xl mx-auto px-6 py-8 pb-16">{children}</main>
    </ToastProvider>
  );
}
