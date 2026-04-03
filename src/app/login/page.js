'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Turnstile } from '@marsidev/react-turnstile';

export default function Login() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');

  // 1. 인증 처리 로직
  const handleAuth = async (e) => {
    e.preventDefault();

    if (!captchaToken) {
      setMessage("❌ '로봇이 아닙니다' 체크를 완료해 주세요!");
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      if (authMode === 'signup') {
        // 회원가입
        const nicknameRegex = /^[가-힣]{2,6}$/;
        if (!nicknameRegex.test(nickname)) {
          throw new Error("닉네임은 한글 2~6자만 가능해요!");
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { display_name: nickname },
            captchaToken: captchaToken 
          }
        });
        if (error) throw error;
        setMessage('✅ 회원가입 성공! 이메일을 확인해서 로그인 해주세요.');
        setAuthMode('login');
      } 
      else if (authMode === 'login') {
        // 로그인
        const { error } = await supabase.auth.signInWithPassword({ 
          email, 
          password,
          options: { captchaToken: captchaToken }
        });
        if (error) throw error;
        router.push('/');
        router.refresh();
      } 
      else if (authMode === 'forgot') {
        // 🌟 비밀번호 재설정 이메일 발송
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`, // 재설정 페이지 주소
          captchaToken: captchaToken
        });
        if (error) throw error;
        setMessage('✅ 재설정 링크를 보냈어요! 이메일을 확인해 주세요.');
      }
    } catch (error) {
      setMessage(`❌ 에러: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <img 
              src="https://bpoerueomemrufjoxrej.supabase.co/storage/v1/object/public/thermometer/logo.png" 
              alt="싸게사게" 
              className="h-14 w-auto object-contain mx-auto mb-2" 
            />
          </a>
          <h2 className="text-2xl font-bold text-gray-800">
            {authMode === 'signup' && '새로 오셨군요! 환영해요 🎉'}
            {authMode === 'login' && '다시 오셨군요! 반가워요 👋'}
            {authMode === 'forgot' && '비밀번호를 찾아드릴게요 🔑'}
          </h2>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {/* 닉네임 입력 (회원가입 모드일 때만) */}
          {authMode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">닉네임 (한글 2~6자)</label>
              <input
                type="text"
                value={nickname}
                maxLength={6}
                onChange={(e) => setNickname(e.target.value)} 
                placeholder="사용하실 닉네임"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {/* 이메일 입력 (공통) */}
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
          
          {/* 비밀번호 입력 (로그인/회원가입 모드일 때만) */}
          {authMode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">비밀번호</label>
                {authMode === 'login' && (
                  <button 
                    type="button"
                    onClick={() => { setAuthMode('forgot'); setMessage(''); }}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    비밀번호를 잊으셨나요?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8자리 이상 입력"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          <div className="flex justify-center my-2">
            <Turnstile 
              key={authMode} // 모드 바뀔 때마다 캡차 초기화
              siteKey="0x4AAAAAACxeWde3rnX77zxM" 
              onSuccess={(token) => setCaptchaToken(token)} 
            />
          </div>

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
            {loading ? '처리 중...' : (
              authMode === 'signup' ? '가입하기' : 
              authMode === 'login' ? '로그인하기' : '재설정 이메일 보내기'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          {authMode === 'login' ? (
            <>아직 계정이 없으신가요? <button type="button" onClick={() => setAuthMode('signup')} className="text-blue-600 font-bold hover:underline">10초 만에 가입하기</button></>
          ) : (
            <>이미 계정이 있으신가요? <button type="button" onClick={() => setAuthMode('login')} className="text-blue-600 font-bold hover:underline">로그인하러 가기</button></>
          )}
        </div>
      </div>
    </div>
  );
}