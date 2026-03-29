'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Turnstile } from '@marsidev/react-turnstile'; // 👈 라이브러리 임포트 확인

export default function Login() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState(''); // 👈 토큰 상태

  const handleAuth = async (e) => {
    e.preventDefault();

    // 1. 닉네임 검사 (가입 시)
    if (isSignUp) {
      const nicknameRegex = /^[가-힣]{2,6}$/;
      if (!nicknameRegex.test(nickname)) {
        setMessage("❌ 닉네임은 한글 2~6자만 가능해요!");
        return;
      }
    }

    // 🌟 2. 캡차 토큰 검사 (가입/로그인 공통)
    if (!captchaToken) {
      setMessage("❌ '로봇이 아닙니다' 체크를 완료해 주세요!");
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        // 🌟 회원가입 로직 (캡차 포함)
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { display_name: nickname },
            captchaToken: captchaToken // 👈 여기에 토큰 전달
          }
        });
        if (error) throw error;
        setMessage('✅ 회원가입 성공! 이메일을 확인해서 로그인 해주세요.');
        setIsSignUp(false);
      } else {
        // 🌟 로그인 로직 (캡차 포함)
        const { error } = await supabase.auth.signInWithPassword({ 
          email, 
          password,
          options: { 
            captchaToken: captchaToken // 👈 로그인 시에도 Supabase 설정에 따라 필요함
          }
        });
        if (error) throw error;
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      setMessage(`❌ 에러: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <img 
              src="https://bpoerueomemrufjoxrej.supabase.co/storage/v1/object/public/thermometer/logo.png" 
              alt="싸게사게" 
              className="h-14 w-auto object-contain mx-auto mb-2" 
            />
          </a>
          <h2 className="text-2xl font-bold text-gray-800">
            {isSignUp ? '새로 오셨군요! 환영해요 🎉' : '다시 오셨군요! 반가워요 👋'}
          </h2>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          
          {/* 1. 닉네임 (가입 시에만) */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">닉네임 (한글 2~6자)</label>
              <input
                type="text"
                value={nickname}
                maxLength={6}
                onChange={(e) => setNickname(e.target.value.replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣]/g, ''))}
                placeholder="사용하실 닉네임"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {/* 2. 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일 주소</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* 3. 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자리 이상 입력"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 🌟 4. 캡차 위젯 추가 (버튼 바로 위에 배치) */}
          <div className="flex justify-center my-2">
            <Turnstile 
              siteKey="0x4AAAAAACxeWde3rnX77zxM" 
              onSuccess={(token) => setCaptchaToken(token)} 
            />
          </div>

          {/* 에러/성공 메시지 */}
          {message && (
            <div className={`p-3 rounded-lg text-sm font-medium text-center ${message.includes('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl mt-2 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? '처리 중...' : (isSignUp ? '가입하기' : '로그인하기')}
          </button>
        </form>

        {/* ... 하단 가입 유도 버튼 및 안내 문구 생략 ... */}
        <div className="mt-8 text-center text-sm text-gray-500">
          {isSignUp ? '이미 계정이 있으신가요? ' : '아직 계정이 없으신가요? '}
          <button 
            type="button" 
            onClick={() => { setIsSignUp(!isSignUp); setMessage(''); setCaptchaToken(''); }}
            className="text-blue-600 font-bold hover:underline"
          >
            {isSignUp ? '로그인하러 가기' : '10초 만에 가입하기'}
          </button>
        </div>
      </div>
    </div>
  );
}