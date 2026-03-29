'use client'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function MyPage() {
  const [user, setUser] = useState(null);
  const [telegramId, setTelegramId] = useState(null); // 🌟 텔레그램 연동 상태 저장
  const [loading, setLoading] = useState(true);
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [authCode, setAuthCode] = useState(''); // 🌟 인증코드 상태
  const router = useRouter();

  // 1. 유저 정보 및 키워드/프로필 불러오기
  const fetchData = useCallback(async (userId) => {
    // 키워드 가져오기
    const { data: kwData } = await supabase
      .from('user_keywords')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // 프로필(텔레그램 ID) 가져오기
    const { data: profData } = await supabase
      .from('profiles')
      .select('telegram_chat_id')
      .eq('id', userId)
      .single();

    if (kwData) setKeywords(kwData);
    if (profData) setTelegramId(profData.telegram_chat_id);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요해요! 😅');
        router.push('/login');
      } else {
        setUser(session.user);
        await fetchData(session.user.id);
        setLoading(false);
      }
    };
    checkUser();
  }, [router, fetchData]);

  // 2. 인증번호 생성 로직 (작성하신 코드 반영)
  const generateAuthCode = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    const { error } = await supabase
      .from('profiles')
      .update({ auth_code: code, auth_code_expires_at: expiresAt })
      .eq('id', user.id);

    if (error) {
      alert('코드 생성 실패 😢');
    } else {
      setAuthCode(code);
    }
  };

  // ... (키워드 추가/삭제/회원탈퇴 함수는 기존과 동일) ...
  const addKeyword = async () => { /* 기존 코드 유지 */ };
  const deleteKeyword = async (id) => { /* 기존 코드 유지 */ };
  const handleWithdrawal = async () => { /* 기존 코드 유지 */ };

  if (loading) return <div className="p-10 text-center text-gray-400">확인 중... ⏳</div>;

  return (
    <div className="max-w-2xl mx-auto bg-gray-100 min-h-screen pb-10 p-4 font-sans text-gray-800">
      <div className="bg-white rounded-3xl shadow-sm p-8 mt-6">
        <h2 className="text-xl font-bold mb-2">🔔 내 핫딜 알림 설정</h2>
        <p className="text-sm text-gray-500 mb-8">
          반가워요, <span className="font-bold text-gray-800">{user?.user_metadata?.display_name || '회원'}</span>님!
        </p>

        {/* 1. 키워드 입력/리스트 (기존 코드 유지) */}
        <div className="flex gap-2 mb-6">
          <input 
            type="text" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="예: 아이폰, 맥북, 플스"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button onClick={addKeyword} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl">추가</button>
        </div>

        <div className="space-y-3 mb-10">
          <p className="text-xs font-bold text-gray-400 ml-1">등록된 키워드 ({keywords.length})</p>
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <div key={kw.id} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-100 shadow-sm">
                <span className="text-sm font-medium">{kw.keyword}</span>
                <button onClick={() => deleteKeyword(kw.id)} className="text-blue-300 hover:text-blue-600 font-bold ml-1">✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* 🌟 2. 텔레그램 연동 영역 (여기가 핵심!) */}
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-10 text-center">
          <p className="text-xs text-gray-400 mb-2">텔레그램 봇 연동 상태</p>
          
          {telegramId ? (
            <p className="text-sm font-bold text-green-500">연동 완료 ✅ (알림 수신 가능)</p>
          ) : (
            <div>
              {authCode ? (
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 animate-fade-in">
                  <p className="text-xs text-blue-400 mb-2 font-bold uppercase tracking-wider">Your Auth Code</p>
                  <p className="text-4xl font-black text-blue-600 tracking-[0.2em] mb-4">{authCode}</p>
                  
                  {/* 봇으로 바로가는 버튼 추가 */}
                  <a 
                    href={`https://t.me/유저님이_만든_봇_아이디?start=${authCode}`} // 👈 여기에 봇 아이디 입력!
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all active:scale-95 mb-4"
                  >
                    텔레그램에서 인증하기 🚀
                  </a>
                  
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    버튼을 누르면 텔레그램 앱이 열립니다. <br />
                    봇에게 <span className="font-bold text-blue-600">/인증 {authCode}</span>를 보내주세요!
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-bold text-red-400 mb-3">연동 전 ❌</p>
                  <button 
                    onClick={generateAuthCode}
                    className="text-xs bg-white border border-gray-200 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-sm"
                  >
                    인증번호 발급받기
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* 3. 하단 버튼 (기존 코드 유지) */}
        <div className="flex items-center justify-between border-t pt-6">
          <button onClick={handleWithdrawal} className="text-xs text-red-400 hover:text-red-600 underline decoration-red-200 underline-offset-4">회원탈퇴</button>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); router.refresh(); }} className="text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors">로그아웃</button>
        </div>
      </div>
    </div>
  );
}