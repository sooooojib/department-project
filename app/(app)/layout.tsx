import Sidebar from "@/components/Sidebar";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const payload = await getServerSession(authOptions);
  const role = payload?.user?.role || null;

  return (
    <>
      <Sidebar role={role as any} />
      <main className="transition-all duration-300 ml-0 md:ml-[72px]">
        {children}
      </main>
    </>
  );
}
