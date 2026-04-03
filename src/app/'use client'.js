'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DealDetail({ params }) {
  const { id } = params; // 사용자가 클릭한 상품의 고유 ID

  // 나중에 Supabase에서 가져올 가짜 히스토리 데이터
  const priceHistory = [
    { date: '03-10', price: 45000 },
    { date: '03-12', price: 42000 },
    { date: '03-14', price: 39000 },
    { date: '03-16', price: 43000 },
    { date: '03-17', price: 38000 }, // 현재가
  ];

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      <header className="p-4 border-b flex items-center">
        <button onClick={() => window.history.back()} className="mr-4">←</button>
        <h1 className="text-lg font-bold">가격 추이 분석</h1>
      </header>

      <main className="p-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">UGREEN 100W 충전기</h2>
          <p className="text-red-600 font-bold text-2xl">38,000원</p>
          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded mt-2 inline-block">
            역대 최저가 대비 5% 하락
          </span>
        </div>

        {/* 가격 추이 그래프 영역 */}
        <div className="h-64 w-full bg-gray-50 rounded-xl p-2 border border-gray-100">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceHistory}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis hide={true} domain={['dataMin - 1000', 'dataMax + 1000']} />
              <Tooltip 
                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#2563eb" 
                strokeWidth={3} 
                dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8">
          <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg">
            구매하러 가기
          </button>
        </div>
      </main>
    </div>
  );
}