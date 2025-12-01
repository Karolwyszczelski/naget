// app/admin/(protected)/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../../../../untils/supabase/server"; // dostosuj ścieżkę

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    redirect("/admin/login");
  }

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex bg-neutral-100">
      <AdminSidebar />

      <div className="md:hidden fixed inset-x-0 top-0 z-30 border-b border-border bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-2">
          <div>
            <p className="text-[9px] uppercase tracking-[0.24em] text-neutral-500">
              Panel administracyjny
            </p>
            <p className="text-[16px] font-extrabold text-accent uppercase">
              Naget
            </p>
          </div>
          <span className="text-[11px] text-neutral-500">admin</span>
        </div>
      </div>

      <main className="flex-1 min-h-screen md:ml-0">
        <div className="pt-[56px] md:pt-0 p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
