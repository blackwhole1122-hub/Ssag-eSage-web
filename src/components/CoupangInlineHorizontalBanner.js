'use client';

import { useEffect, useRef, useState } from 'react';

function getBannerSize(containerWidth) {
  const width = Math.max(320, Math.min(980, Math.round(containerWidth || 0)));
  const height = Math.max(100, Math.min(180, Math.round(width * 0.22)));
  return { width, height };
}

export default function CoupangInlineHorizontalBanner() {
  const wrapperRef = useRef(null);
  const slotRef = useRef(null);
  const [size, setSize] = useState({ width: 320, height: 100 });

  useEffect(() => {
    const update = () => {
      const width = wrapperRef.current?.clientWidth || 320;
      setSize(getBannerSize(width));
    };

    update();
    const ro = new ResizeObserver(update);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    window.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;

    slot.innerHTML = '';

    const externalScript = document.createElement('script');
    externalScript.src = 'https://ads-partners.coupang.com/g.js';
    externalScript.async = true;

    const inlineScript = document.createElement('script');
    inlineScript.text = `
      new PartnersCoupang.G({
        id: 983816,
        template: "carousel",
        trackingCode: "AF9495324",
        width: "${size.width}",
        height: "${size.height}",
        tsource: ""
      });
    `;

    externalScript.onload = () => {
      slot.appendChild(inlineScript);
    };

    slot.appendChild(externalScript);

    return () => {
      slot.innerHTML = '';
    };
  }, [size.width, size.height]);

  return (
    <div className="mt-6" ref={wrapperRef}>
      <div
        className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white"
        style={{ width: '100%', maxWidth: `${size.width}px`, height: `${size.height}px` }}
      >
        <div ref={slotRef} style={{ width: `${size.width}px`, height: `${size.height}px` }} />
      </div>
      <p className="mt-2 text-center text-[11px] text-[#64748B]">
        이 배너는 제휴 활동의 일환으로 일정액의 수수료를 제공받습니다
      </p>
    </div>
  );
}
