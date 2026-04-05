import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import IntroLanding from "@/components/intro-landing";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) redirect("/app");
  return <IntroLanding />;
}
