"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, HardDrive, Loader2 } from "lucide-react";

type StatusState = "loading" | "cloud" | "local" | "error";

interface StatusData {
  mode: "cloud" | "local";
  services: {
    configured: boolean;
    cloudinaryConnected: boolean;
    sheetsConnected: boolean;
    error?: string;
  };
}

interface ConnectionStatusProps {
  compact?: boolean;
}

export default function ConnectionStatus({
  compact = false,
}: ConnectionStatusProps) {
  const [status, setStatus] = useState<StatusState>("loading");
  const [detail, setDetail] = useState<string>("");
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data: StatusData) => {
        if (
          data.mode === "cloud" &&
          data.services.cloudinaryConnected &&
          data.services.sheetsConnected
        ) {
          setStatus("cloud");
          setDetail("Cloudinary + Sheets connected");
        } else if (data.mode === "local") {
          setStatus("local");
          setDetail(
            data.services.configured
              ? data.services.error || "Connection failed, using local"
              : data.services.error || "Local storage mode"
          );
        } else {
          setStatus("error");
          setDetail(data.services.error || "Connection issue");
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
      iconClass: "animate-spin text-white/60",
      dotColor: "bg-white/40",
    },
    cloud: {
      icon: Cloud,
      iconClass: "text-green-300",
      dotColor: "bg-green-400",
    },
    local: {
      icon: HardDrive,
      iconClass: "text-amber-300",
      dotColor: "bg-amber-400",
    },
    error: {
      icon: CloudOff,
      iconClass: "text-red-300",
      dotColor: "bg-red-400",
    },
  };

  const { icon: Icon, iconClass, dotColor } = config[status];

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowTooltip(!showTooltip)}
          onBlur={() => setTimeout(() => setShowTooltip(false), 200)}
          className="flex items-center justify-center rounded-md bg-white/20 p-1.5 text-white transition-colors hover:bg-white/30"
          title={detail}
        >
          <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
          <span
            className={`absolute -end-0.5 -top-0.5 h-2 w-2 rounded-full ${dotColor} ring-1 ring-primary-500`}
          />
        </button>

        {showTooltip && detail && (
          <div className="absolute end-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white p-2 text-xs text-gray-600 shadow-xl">
            <div className="flex items-start gap-2">
              {status === "cloud" && (
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

  return (
    <div className="relative">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onBlur={() => setTimeout(() => setShowTooltip(false), 200)}
        className="flex items-center gap-1 rounded-md bg-white/20 px-2 py-1 text-[10px] font-bold text-white transition-colors hover:bg-white/30"
      >
        <Icon className={`h-3 w-3 ${iconClass}`} />
      </button>

      {showTooltip && detail && (
        <div className="absolute end-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white p-2 text-xs text-gray-600 shadow-xl">
          <div className="flex items-start gap-2">
            {status === "cloud" && (
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
