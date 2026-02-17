import { setRequestLocale } from "next-intl/server";
import HomeClient from "@/components/HomeClient";

export default function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  return <HomeClient />;
}
