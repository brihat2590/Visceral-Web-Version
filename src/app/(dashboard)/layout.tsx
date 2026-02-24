import { getServerUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import VisceralSidebar from "@/components/VisceralSidebar";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  // Map your server user data to the format the Sidebar expects
 
  return (
    <VisceralSidebar >
      {children}
    </VisceralSidebar>
  );
}