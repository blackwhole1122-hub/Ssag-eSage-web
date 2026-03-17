'use client'
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import React from 'react';

// 그래프 도구 동적 로딩 (기존과 동일)
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

export default function DealDetail({ params }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;

  const priceData = [
    { date: '03-11', price: 42000 },
    { date: '03-12', price: 41000 },
    { date: '03-14', price: 45000 },
    { date: '03-15', price: 38000 },
    { date: '03-16', price: 40000 },
    { date: '03-17', price: 35000 },
  ];

  return (
    // [변경 1] max-w-5xl로 폭을 넓혀 PC 화면에 대응합니다.
    <div className="max-w-5xl mx-auto bg-white min-h-screen pb-10">
      <header className="p-4 border-b flex items-center sticky top-0 bg-white z-10">
        <button onClick={() => router.back()} className="mr-4 text-xl hover:text-blue-600 transition-colors">←</button>
        <span className="font-bold text-lg">상품 상세 정보</span>
      </header>
      
      <main className="p-4 md:p-10">
        {/* [변경 2] md:flex-row를 사용하여 PC에서는 좌우, 모바일은 상하로 배치합니다. */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* 왼쪽 영역: 상품 텍스트 정보 */}
          <div className="flex-1 w-full">
            <div className="mb-6">
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">대박급</span>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 mt-3">
                {id}번 상품 상세 정보 (뽐뿌 핫딜)
              </h2>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-red-600">35,000원</span>
                <span className="text-gray-400 line-through">45,000원</span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 leading-relaxed mb-6">
              💡 분석 결과: 현재 가격은 최근 7일 중 가장 저렴합니다. <br/>
              역대 최저가에 근접해 있으니 빠른 구매를 추천드립니다!
            </div>

            {/* PC에서만 보이는 구매 버튼 */}
            <button className="hidden md:block w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-all">
              판매 페이지로 이동하기
            </button>
          </div>

          {/* 오른쪽 영역: 가격 변동 그래프 */}
          <div className="flex-1 w-full bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-gray-700 font-bold mb-6 flex items-center gap-2">
              📈 가격 변동 추이
            </h3>
            <div className="h-64 md:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#2563eb" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* 모바일에서만 보이는 하단 고정 버튼 느낌 */}
          <button className="md:hidden w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg mt-4">
            판매 페이지로 이동하기
          </button>
        </div>
      </main>
    </div>
  );
}