import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import HomeClient from "@/components/HomeClient";
import LoginScreen from "@/components/LoginScreen";

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <Suspense>
        <LoginScreen />
      </Suspense>
    );
  }

  return <HomeClient />;
}
