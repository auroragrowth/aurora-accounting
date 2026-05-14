import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: settings } = await supabase
    .from("settings")
    .select("company_number, email")
    .maybeSingle();

  return (
    <header className="no-print bg-brand-blue text-white py-5">
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-brand-orange rounded-[10px] grid place-items-center text-white heading-display text-2xl leading-none shadow-[0_2px_0_rgba(0,0,0,0.15)]">
            A
          </div>
          <div>
            <div className="heading-display text-xl leading-none">AURORA EVENTS</div>
            <div className="text-[11px] opacity-80 tracking-widest mt-1">
              BOOKKEEPING · INVOICING
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs opacity-75 text-right hidden sm:block">
            <div>Company No. {settings?.company_number ?? "16712612"}</div>
            <div>{user?.email}</div>
          </div>
          <form action="/auth/signout" method="post">
            <button className="text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
