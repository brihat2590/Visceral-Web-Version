import { getServerUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();


  if (!user) {
    redirect("/login");
  }

  return <div>{children}</div>;
}
