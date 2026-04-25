'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

function getMobileSize(width) {
  const viewport = Math.max(320, width || 0);
  const bannerWidth = Math.max(300, Math.min(640, viewport - 32));
  const bannerHeight = Math.max(90, Math.min(140, Math.round(bannerWidth * 0.28)));
  return { width: bannerWidth, height: bannerHeight };
}

export default function CoupangSidebarBanner({ mode = 'desktop' }) {
  const containerRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth || 0);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const config = useMemo(() => {
    const isDesktop = viewportWidth >= 1024;

    if (mode === 'desktop') {
      if (!isDesktop) return null;
      return { width: 250, height: 550 };
    }

    if (isDesktop) return null;
    return getMobileSize(viewportWidth);
  }, [mode, viewportWidth]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !config) return;

    container.innerHTML = '';

    const externalScript = document.createElement('script');
    externalScript.src = 'https://ads-partners.coupang.com/g.js';
    externalScript.async = true;

    const inlineScript = document.createElement('script');
    inlineScript.text = `
      new PartnersCoupang.G({
        id: 983816,
        template: "carousel",
        trackingCode: "AF9495324",
        width: "${config.width}",
        height: "${config.height}",
        tsource: ""
      });
    `;

    externalScript.onload = () => {
      container.appendChild(inlineScript);
    };

    container.appendChild(externalScript);

    return () => {
      container.innerHTML = '';
    };
  }, [config]);

  if (!config) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative overflow-hidden rounded-xl border border-[#E2E8F0] bg-white"
        style={{ width: `${config.width}px`, height: `${config.height}px` }}
      >
        <span className="absolute left-2 top-2 z-10 rounded-md bg-[#1E293B] px-2 py-1 text-[10px] font-semibold text-white">
          광고 · 제휴
        </span>
        <div ref={containerRef} style={{ width: `${config.width}px`, height: `${config.height}px` }} />
      </div>
      <p className="text-center text-[11px] text-[#64748B]">
        이 배너는 제휴 활동의 일환으로 일정액의 수수료를 제공받습니다
      </p>
    </div>
  );
}
