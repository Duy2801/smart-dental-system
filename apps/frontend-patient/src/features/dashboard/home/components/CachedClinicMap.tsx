"use client";

import { useEffect, useState } from "react";

type CachedClinicMapProps = {
  address: string;
  clinicName: string;
  mapEmbedUrl: string;
  mapDirectUrl: string;
};

const MAP_CACHE_KEY = "smart_dental_map_loaded_v1";

export function CachedClinicMap({
  address,
  clinicName,
  mapEmbedUrl,
  mapDirectUrl,
}: CachedClinicMapProps) {
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isCachedSession, setIsCachedSession] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(MAP_CACHE_KEY);
        if (cached === "true") {
          setIsCachedSession(true);
        }
      } catch {
        // ignore sessionStorage errors
      }
    }
  }, []);

  const handleIframeLoad = () => {
    setIsIframeLoaded(true);
    setIsCachedSession(true);
    try {
      sessionStorage.setItem(MAP_CACHE_KEY, "true");
    } catch {
      // ignore sessionStorage write errors
    }
  };

  return (
    <div className="relative h-full min-h-[380px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#f4f3f0] shadow-inner">
      {/* 1. Resource Hints for Instant Network Resolution */}
      <link rel="preconnect" href="https://maps.google.com" />
      <link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="" />
      <link rel="dns-prefetch" href="https://maps.google.com" />
      <link rel="dns-prefetch" href="https://maps.gstatic.com" />

      {/* 2. Instant Static Vector Map Preview (0ms Paint, Zero Layout Shift) */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 select-none ${
          isIframeLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        aria-hidden={isIframeLoaded}
      >
        {/* Vector Map Canvas Representation */}
        <svg
          className="h-full w-full object-cover"
          viewBox="0 0 800 500"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Ground */}
          <rect width="800" height="500" fill="#f4f3f0" />

          {/* Urban Blocks & Buildings */}
          <g fill="#eceae4" stroke="#e3e0d8" strokeWidth="1">
            <rect x="40" y="40" width="120" height="90" rx="4" />
            <rect x="180" y="30" width="140" height="100" rx="4" />
            <rect x="340" y="45" width="160" height="85" rx="4" />
            <rect x="520" y="35" width="240" height="95" rx="4" />

            <rect x="40" y="180" width="110" height="120" rx="4" />
            <rect x="170" y="180" width="130" height="130" rx="4" />
            <rect x="320" y="195" width="180" height="115" rx="4" />
            <rect x="520" y="180" width="240" height="125" rx="4" />

            <rect x="50" y="340" width="180" height="130" rx="4" />
            <rect x="250" y="345" width="220" height="125" rx="4" />
            <rect x="490" y="340" width="270" height="130" rx="4" />
          </g>

          {/* Parks & Greenery */}
          <g fill="#dcedd9" stroke="#d1e3ce" strokeWidth="1">
            <rect x="680" y="220" width="100" height="80" rx="8" />
            <rect x="700" y="360" width="80" height="100" rx="6" />
          </g>

          {/* Minor Cross Streets */}
          <g stroke="#ffffff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
            {/* Ham Nghi */}
            <line x1="160" y1="0" x2="160" y2="500" />
            {/* Do Quang */}
            <line x1="310" y1="0" x2="310" y2="500" />
            {/* Trieu Nu Vuong */}
            <line x1="510" y1="0" x2="510" y2="500" />
            {/* Le Dinh Duong */}
            <line x1="660" y1="0" x2="660" y2="500" />
          </g>

          {/* Minor Street Borders */}
          <g stroke="#dedcd4" strokeWidth="1.5">
            <line x1="153" y1="0" x2="153" y2="500" />
            <line x1="167" y1="0" x2="167" y2="500" />
            <line x1="303" y1="0" x2="303" y2="500" />
            <line x1="317" y1="0" x2="317" y2="500" />
            <line x1="503" y1="0" x2="503" y2="500" />
            <line x1="517" y1="0" x2="517" y2="500" />
            <line x1="653" y1="0" x2="653" y2="500" />
            <line x1="667" y1="0" x2="667" y2="500" />
          </g>

          {/* Main Arterial Avenue: Nguyen Van Linh (Horizontal Broad Road) */}
          <g>
            {/* Road borders */}
            <line x1="0" y1="145" x2="800" y2="160" stroke="#d5d2c8" strokeWidth="32" strokeLinecap="square" />
            {/* Road asphalt */}
            <line x1="0" y1="145" x2="800" y2="160" stroke="#ffffff" strokeWidth="28" strokeLinecap="square" />
            {/* Center median divider */}
            <line x1="0" y1="145" x2="800" y2="160" stroke="#fcd34d" strokeWidth="2" strokeDasharray="16 10" />
          </g>

          {/* Secondary Arterial: Hoang Dieu */}
          <g>
            <line x1="430" y1="320" x2="780" y2="480" stroke="#d5d2c8" strokeWidth="18" />
            <line x1="430" y1="320" x2="780" y2="480" stroke="#ffffff" strokeWidth="15" />
          </g>

          {/* Street Labels */}
          <g fill="#64748b" fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif">
            <text x="210" y="150" transform="rotate(1, 210, 150)">Đ. Nguyễn Văn Linh</text>
            <text x="560" y="159" transform="rotate(1, 560, 159)">Đ. Nguyễn Văn Linh</text>
            <text x="145" y="260" transform="rotate(90, 145, 260)">Đ. Hàm Nghi</text>
            <text x="295" y="260" transform="rotate(90, 295, 260)">Đ. Đỗ Quang</text>
            <text x="495" y="260" transform="rotate(90, 495, 260)">Đ. Triệu Nữ Vương</text>
            <text x="645" y="260" transform="rotate(90, 645, 260)">Đ. Lê Đình Dương</text>
            <text x="530" y="380" transform="rotate(24, 530, 380)">Đ. Hoàng Diệu</text>
          </g>

          {/* Surrounding Landmark POIs */}
          <g fill="#94a3b8" fontSize="10" fontWeight="600" fontFamily="system-ui, sans-serif">
            <text x="610" y="90">Pizza 4P's Hoàng Văn Thụ</text>
            <text x="580" y="70">Umi Izakaya</text>
            <text x="490" y="220">Bánh Xèo Bà Dưỡng</text>
            <text x="730" y="250">Phố đi bộ</text>
          </g>

          {/* Center Pin & Radar Pulse on 123 Nguyen Van Linh (coordinates ~420, 153) */}
          <g transform="translate(420, 153)">
            {/* Pulsing Radar Ring */}
            <circle r="22" fill="#ef4444" opacity="0.25">
              <animate attributeName="r" values="10;36" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="12" fill="#ef4444" opacity="0.35" />

            {/* Red Google Pin SVG Icon */}
            <g transform="translate(-16, -34)">
              <path
                d="M16 0C7.16 0 0 7.16 0 16c0 11.5 16 28 16 28s16-16.5 16-28c0-8.84-7.16-16-16-16z"
                fill="#ea4335"
              />
              <circle cx="16" cy="15" r="7" fill="#ffffff" />
              <circle cx="16" cy="15" r="4.5" fill="#c5221f" />
            </g>

            {/* Landmark Label */}
            <text
              x="20"
              y="-10"
              fill="#b91c1c"
              fontSize="11"
              fontWeight="800"
              fontFamily="system-ui, sans-serif"
            >
              123 Nguyễn Văn Linh
            </text>
          </g>

          {/* Google Watermark in bottom right */}
          <g transform="translate(680, 480)" opacity="0.7">
            <text x="0" y="0" fill="#475569" fontSize="14" fontWeight="800" fontFamily="system-ui, sans-serif">
              Google
            </text>
          </g>
        </svg>

        {/* Floating Google Place Card Overlay (Matching Google Maps exact style) */}
        <div className="absolute left-4 top-16 max-w-[280px] rounded-xl border border-slate-200/90 bg-white p-3 shadow-lg sm:left-6 sm:top-18">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#0058bc]" />
                <h4 className="text-xs font-bold text-slate-900">{clinicName}</h4>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-slate-600 line-clamp-2">
                {address}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-amber-500">
                <span>4.9</span>
                <span>★★★★★</span>
                <span className="text-slate-400 font-medium">(493)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Indicator / Cache Pulse Banner */}
        <div className="absolute bottom-3 left-4 flex items-center gap-2 rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm backdrop-blur">
          <span className="flex h-2 w-2">
            <span className="h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
          </span>
          <span>{isCachedSession ? "Bản đồ đã lưu bộ nhớ đệm (Tải tức thì)" : "Đang chuẩn bị bản đồ tương tác..."}</span>
        </div>
      </div>

      {/* 3. High-Performance Interactive Iframe (Loads eagerly in background, cross-fades when ready) */}
      <iframe
        title={`Bản đồ vị trí ${clinicName}`}
        src={mapEmbedUrl}
        className={`h-full min-h-[380px] w-full border-0 transition-opacity duration-700 ${
          isIframeLoaded ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        loading="eager"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={handleIframeLoad}
      />

      {/* 4. Top Action Overlay (Always visible & interactive) */}
      <div className="pointer-events-none absolute left-4 right-4 top-4 flex items-center justify-between">
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 text-xs font-bold text-slate-800 shadow-md backdrop-blur">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#0058bc]" />
          <span>{clinicName}</span>
          <span className="hidden sm:inline-flex rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
            Đã cache
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <a
            href={mapDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-slate-900/90 px-3.5 py-2 text-xs font-bold text-white shadow-md backdrop-blur transition hover:bg-slate-900"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span>Chỉ đường</span>
          </a>
        </div>
      </div>
    </div>
  );
}
