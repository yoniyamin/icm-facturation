"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Receipt, LogIn } from "lucide-react";

export default function LoginScreen() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-warm-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500 shadow-lg">
            <Receipt className="h-9 w-9 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-primary-900">
              {t("app.title")}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{t("app.subtitle")}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
          {error === "AccessDenied" && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-center text-sm text-red-600">
                {t("auth.notAuthorized")}
              </p>
            </div>
          )}

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary-500 px-4 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary-600 active:bg-primary-700"
          >
            <LogIn className="h-5 w-5" />
            {t("auth.signIn")}
          </button>
        </div>
      </div>
    </div>
  );
}
