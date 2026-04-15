'use client'

import { useState } from 'react';
import Link from 'next/link';

export default function NavigationWithUtility({ currentPage = '' }) {
  const [showUtilityMenu, setShowUtilityMenu] = useState(false);

  return (
    <nav className="bg-[#FFF9E6] px-4 pb-1 flex items-center gap-5 border-b border-[#E2E8F0]">
      <Link 
        href="/hotdeals" 
        className={`py-3 text-[14px] font-medium transition-colors ${
          currentPage === 'hotdeals' 
            ? 'font-bold text-[#0ABAB5] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#0ABAB5] after:rounded-full' 
            : 'text-[#64748B] hover:text-[#1E293B]'
        }`}
      >
        핫딜모음
      </Link>

      <Link 
        href="/coupang" 
        className={`py-3 text-[14px] font-medium transition-colors ${
          currentPage === 'coupang' 
            ? 'font-bold text-[#0ABAB5] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#0ABAB5] after:rounded-full' 
            : 'text-[#64748B] hover:text-[#1E293B]'
        }`}
      >
        쿠팡핫딜
      </Link>

      <Link 
        href="/hotdeal-thermometer" 
        className={`py-3 text-[14px] font-medium transition-colors ${
          currentPage === 'thermometer' 
            ? 'font-bold text-[#0ABAB5] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#0ABAB5] after:rounded-full' 
            : 'text-[#64748B] hover:text-[#1E293B]'
        }`}
      >
        핫딜온도계
      </Link>

      <Link 
        href="/blog" 
        className={`py-3 text-[14px] font-medium transition-colors ${
          currentPage === 'blog' 
            ? 'font-bold text-[#0ABAB5] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#0ABAB5] after:rounded-full' 
            : 'text-[#64748B] hover:text-[#1E293B]'
        }`}
      >
        정보모음
      </Link>

      {/* ✨ 유틸리티 드롭다운 메뉴 */}
      <div 
        className="relative"
        onMouseEnter={() => setShowUtilityMenu(true)}
        onMouseLeave={() => setShowUtilityMenu(false)}
      >
        <Link 
          href="/utility" 
          className={`block py-3 text-[14px] font-medium transition-colors ${
            currentPage === 'utility' 
              ? 'font-bold text-[#0ABAB5] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#0ABAB5] after:rounded-full' 
              : 'text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          유틸리티
        </Link>

        {/* 드롭다운 메뉴 */}
        {showUtilityMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 min-w-[200px] py-2 animate-slide-down">
            <Link
              href="/utility/image-background-remover"
              className="block px-4 py-2.5 text-[13px] font-medium text-[#1E293B] hover:bg-[#FAF6F0] transition-colors"
            >
              🖼️ 이미지 배경 제거하기
            </Link>
            {/* 추후 추가될 유틸리티 항목들 */}
          </div>
        )}
      </div>
    </nav>
  );
}
