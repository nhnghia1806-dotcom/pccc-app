import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import PcccElectricClient from "./pccc-electric-client";

export default async function AppPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  return <PcccElectricClient userEmail={session.user.email} />;
}

