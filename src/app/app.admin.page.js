'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // 로딩 상태 추가
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("로그인 시도 시작..."); // 확인용 1
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
  alert('로그인 실패: ' + error.message);
} else {
  console.log("로그인 성공! 쿠키 장부 들고 대시보드로 이동합니다.");
  
  // ✅ router.push 대신 이걸 쓰세요. 
  // 문지기(미들웨어)에게 '나 열쇠 생겼어!'라고 새로고침하며 보여주는 확실한 방법입니다.
  window.location.href = '/admin/dashboard';
}
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-sm border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">싸게사게 관리자 🦀</h1>
        
        <div className="flex flex-col gap-3 mb-6">
          <input 
            type="email" 
            placeholder="이메일" 
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="비밀번호" 
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`w-full p-4 rounded-2xl font-bold text-white transition-colors ${
            isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? '로그인 중...' : '관리자 로그인'}
        </button>
        
        <p className="text-center text-[10px] text-gray-400 mt-4">
          계정이 없다면 수파베이스 Authentication에서 생성하세요.
        </p>
      </form>
    </div>
  );
}