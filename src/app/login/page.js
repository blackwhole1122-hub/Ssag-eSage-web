'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Turnstile } from '@marsidev/react-turnstile';

export default function Login() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!captchaToken) { setMessage("err|로봇이 아닙니다 체크를 완료해 주세요"); return; }
    setLoading(true);
    setMessage('');

    try {
      if (authMode === 'signup') {
        const nicknameRegex = /^[가-힣]{2,6}$/;
        if (!nicknameRegex.test(nickname)) throw new Error("닉네임은 한글 2~6자만 가능해요");
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { display_name: nickname }, captchaToken }
        });
        if (error) throw error;
        setMessage('ok|회원가입 성공! 이메일을 확인해서 로그인 해주세요.');
        setAuthMode('login');
      } else if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
        if (error) throw error;
        router.push('/');
        router.refresh();
      } else if (authMode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
          captchaToken
        });
        if (error) throw error;
        setMessage('ok|재설정 링크를 보냈어요! 이메일을 확인해 주세요.');
      }
    } catch (error) {
      setMessage(`err|${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isError = message.startsWith('err|');
  const msgText = message.replace(/^(ok|err)\|/, '');

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-center items-center p-4">
      <div className="max-w-[400px] w-full">
        
        {/* 로고 */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <img 
              src="/logo-ssagesage.png" 
              alt="싸게사게" 
              className="h-12 w-auto object-contain mx-auto mb-4" 
            />
          </a>
          <h2 className="text-[22px] font-bold text-[#1E293B]">
            {authMode === 'signup' && '새로 오셨군요! 환영해요'}
            {authMode === 'login' && '다시 오셨군요! 반가워요'}
            {authMode === 'forgot' && '비밀번호를 찾아드릴게요'}
          </h2>
          <p className="text-[14px] text-[#64748B] mt-1">
            {authMode === 'signup' && '간단한 가입으로 핫딜 알림을 받아보세요'}
            {authMode === 'login' && '로그인하고 키워드 알림을 설정하세요'}
            {authMode === 'forgot' && '가입한 이메일로 재설정 링크를 보내드려요'}
          </p>
        </div>

        {/* 폼 카드 */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <div className="flex flex-col gap-4">
            
            {authMode === 'signup' && (
              <div>
                <label className="block text-[13px] font-semibold text-[#1E293B] mb-1.5">닉네임</label>
                <input
                  type="text"
                  value={nickname}
                  maxLength={6}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="한글 2~6자"
                  className="w-full px-4 py-3 rounded-xl bg-[#FAF6F0] border-none focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:bg-white text-[14px] placeholder:text-[#94A3B8] transition-all"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-[#1E293B] mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full px-4 py-3 rounded-xl bg-[#FAF6F0] border-none focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:bg-white text-[14px] placeholder:text-[#94A3B8] transition-all"
                required
              />
            </div>

            {authMode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[13px] font-semibold text-[#1E293B]">비밀번호</label>
                  {authMode === 'login' && (
                    <button 
                      type="button"
                      onClick={() => { setAuthMode('forgot'); setMessage(''); }}
                      className="text-[12px] text-[#0ABAB5] font-semibold hover:underline"
                    >
                      비밀번호 찾기
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8자리 이상"
                  className="w-full px-4 py-3 rounded-xl bg-[#FAF6F0] border-none focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:bg-white text-[14px] placeholder:text-[#94A3B8] transition-all"
                  required
                />
              </div>
            )}

            <div className="flex justify-center my-1">
              <Turnstile 
                key={authMode}
                siteKey="0x4AAAAAACxeWde3rnX77zxM" 
                onSuccess={(token) => setCaptchaToken(token)} 
              />
            </div>

            {msgText && (
              <div className={`px-4 py-3 rounded-xl text-[13px] font-medium text-center ${
                isError ? 'bg-[#FFF0F0] text-[#FF6B6B]' : 'bg-[#E6FAF9] text-[#0ABAB5]'
              }`}>
                {msgText}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              onClick={handleAuth}
              className="w-full bg-[#0ABAB5] text-white font-bold text-[15px] py-3.5 rounded-xl hover:bg-[#089490] transition-colors disabled:opacity-50"
            >
              {loading ? '처리 중...' : (
                authMode === 'signup' ? '가입하기' : 
                authMode === 'login' ? '로그인' : '재설정 이메일 보내기'
              )}
            </button>
          </div>
        </div>

        {/* 하단 전환 */}
        <div className="mt-5 text-center text-[14px] text-[#64748B]">
          {authMode === 'login' ? (
            <>아직 계정이 없으신가요? <button type="button" onClick={() => setAuthMode('signup')} className="text-[#0ABAB5] font-bold hover:underline">가입하기</button></>
          ) : (
            <>이미 계정이 있으신가요? <button type="button" onClick={() => setAuthMode('login')} className="text-[#0ABAB5] font-bold hover:underline">로그인</button></>
          )}
        </div>
      </div>
    </div>
  );
}
