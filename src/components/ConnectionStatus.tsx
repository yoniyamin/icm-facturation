"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  CloudOff,
  HardDrive,
  Loader2,
} from "lucide-react";

type StatusState = "loading" | "google" | "local" | "error";

interface StatusData {
  mode: "google" | "local";
  google: {
    configured: boolean;
    driveConnected: boolean;
    sheetsConnected: boolean;
    error?: string;
  };
}

export default function ConnectionStatus() {
  const [status, setStatus] = useState<StatusState>("loading");
  const [detail, setDetail] = useState<string>("");
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data: StatusData) => {
        if (data.mode === "google" && data.google.driveConnected && data.google.sheetsConnected) {
          setStatus("google");
          setDetail("Google Drive + Sheets connected");
        } else if (data.mode === "local") {
          setStatus("local");
          setDetail(
            data.google.configured
              ? data.google.error || "Google connection failed, using local"
              : "Local storage mode"
          );
        } else {
          setStatus("error");
          setDetail(data.google.error || "Connection issue");
        }
      })
      .catch(() => {
        setStatus("error");
        setDetail("Cannot reach server");
      });
  }, []);

  const config = {
    loading: {
      icon: Loader2,
      className: "animate-spin text-white/60",
      bg: "bg-white/20",
      label: "...",
    },
    google: {
      icon: Cloud,
      className: "text-green-300",
      bg: "bg-green-500/30",
      label: "Google",
    },
    local: {
      icon: HardDrive,
      className: "text-amber-300",
      bg: "bg-amber-500/30",
      label: "Local",
    },
    error: {
      icon: CloudOff,
      className: "text-red-300",
      bg: "bg-red-500/30",
      label: "Offline",
    },
  };

  const { icon: Icon, className, bg, label } = config[status];

  return (
    <div className="relative">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onBlur={() => setTimeout(() => setShowTooltip(false), 200)}
        className={`flex items-center gap-1 rounded-md ${bg} px-2 py-1 text-[10px] font-bold text-white transition-colors hover:bg-white/30`}
      >
        <Icon className={`h-3 w-3 ${className}`} />
        {label}
      </button>

      {showTooltip && detail && (
        <div className="absolute top-full end-0 z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white p-2 text-xs text-gray-600 shadow-xl">
          <div className="flex items-start gap-2">
            {status === "google" && (
              <Cloud className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
            )}
            {status === "local" && (
              <HardDrive className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            )}
            {status === "error" && (
              <CloudOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
            )}
            <span>{detail}</span>
          </div>
        </div>
      )}
    </div>
  );
}
