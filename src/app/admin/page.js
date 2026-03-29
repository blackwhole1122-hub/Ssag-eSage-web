'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Turnstile } from '@marsidev/react-turnstile'; // 👈 1. 라이브러리 추가

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState(''); // 👈 2. 토큰 상태 추가
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // 👈 3. 토큰 체크 로직 추가
    if (!captchaToken) {
      alert("로봇 체크를 완료해 주세요! 🤖");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: captchaToken // 👈 4. 로그인 시 토큰 같이 보내기
        }
      });

      if (error) {
        alert('로그인 실패: ' + error.message);
        // 실패 시 캡차 만료될 수 있으니 새로고침 권장
      } else {
        console.log("관리자 인증 성공!");
        window.location.href = '/admin/dashboard';
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4 font-sans">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-sm border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">싸게사게 관리자 🦀</h1>
        
        <div className="flex flex-col gap-3 mb-4">
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

        {/* 🌟 5. 캡차 위젯 추가 */}
        <div className="flex justify-center mb-6">
          <Turnstile 
            siteKey="0x4AAAAAACxeWde3rnX77zxM" 
            onSuccess={(token) => setCaptchaToken(token)} 
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
      </form>
    </div>
  );
}