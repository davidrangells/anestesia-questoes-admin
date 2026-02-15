// src/app/(admin)/admin/layout.tsx
import AdminGuard from "@/components/AdminGuard";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-50 flex">
        <AdminSidebar />

        {/* “min-w-0” evita overflow/colagem em layouts flex */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}