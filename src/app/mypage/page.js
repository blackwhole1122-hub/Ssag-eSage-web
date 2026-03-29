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
  const handleDisconnectTelegram = async () => {
  const confirmDisconnect = confirm("정말 텔레그램 연동을 해제하시겠어요? 😢 더 이상 핫딜 알림을 받을 수 없게 됩니다.");
  
  if (confirmDisconnect) {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        telegram_chat_id: null,
        auth_code: null,
        auth_code_expires_at: null 
      })
      .eq('id', user.id);

    if (error) {
      alert('연동 해제 중 오류가 발생했습니다.');
    } else {
      setTelegramId(null); // 상태 초기화
      setAuthCode('');    // 발급 중이던 코드도 초기화
      alert('텔레그램 연동이 해제되었습니다! 📴');
    }
  }
};

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
      .upsert({ 
        id: user.id, // ID는 반드시 포함해야 함!
        auth_code: code, 
        auth_code_expires_at: expiresAt,
        // 삭제하셨으니 닉네임도 다시 넣어주면 좋아요
        display_name: user.user_metadata?.display_name || '회원'
      });

    if (error) {
      console.error('코드 생성 에러:', error.message);
      alert('코드 생성 실패 😢');
    } else {
      setAuthCode(code);
      // 🌟 방금 만든 데이터를 다시 불러오기 위해 fetchData 실행
      await fetchData(user.id);
    }
  };
  // ... (키워드 추가/삭제/회원탈퇴 함수는 기존과 동일) ...
 // 1. 키워드 추가 함수 (아까 안 됐던 것)
  const addKeyword = async () => {
    if (!newKeyword.trim()) return;
    
    // 중복 체크
    if (keywords.some(k => k.keyword === newKeyword.trim())) {
      alert('이미 등록된 키워드예요! 😊');
      setNewKeyword('');
      return;
    }

    const { error } = await supabase
      .from('user_keywords')
      .insert([{ user_id: user.id, keyword: newKeyword.trim() }]);

    if (error) {
      alert('키워드 추가 실패 😢');
    } else {
      setNewKeyword('');
      await fetchData(user.id); // 목록 새로고침
    }
  };

  // 2. 키워드 삭제 함수
  const deleteKeyword = async (id) => {
    const { error } = await supabase
      .from('user_keywords')
      .delete()
      .eq('id', id);

    if (error) {
      alert('삭제 실패 😢');
    } else {
      await fetchData(user.id); // 목록 새로고침
    }
  };

  // 3. 회원 탈퇴 함수 (지금 에러 나는 주범!)
  const handleWithdrawal = async () => {
    const confirmWithdrawal = confirm(
      "정말 탈퇴하시겠어요? 😭 등록된 키워드와 알림 설정이 모두 삭제됩니다."
    );

    if (confirmWithdrawal) {
      setLoading(true);
      try {
        // 프로필 및 관련 데이터 삭제 (RLS 설정에 따라 다를 수 있음)
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);

        if (error) throw error;

        // 로그아웃 처리 및 홈으로 이동
        await supabase.auth.signOut();
        alert('그동안 이용해주셔서 감사합니다. 🙇‍♂️');
        router.push('/');
        router.refresh();
      } catch (error) {
        alert('탈퇴 처리 중 오류가 발생했습니다.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

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

        {/* 🌟 텔레그램 연동 영역 최종본 */}
<div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-10 text-center">
  <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">텔레그램 알림 설정</p>
  
  {telegramId ? (
    <div className="animate-fade-in">
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-bold text-green-500 flex items-center gap-1">
          <span className="text-lg">✅</span> 연동 완료
        </p>
        <p className="text-[10px] text-gray-400 mb-4">Chat ID: {telegramId}</p>
        
        {/* 연동 해제 버튼 */}
        <button 
          onClick={handleDisconnectTelegram}
          className="text-[11px] text-gray-400 hover:text-red-400 underline underline-offset-4 transition-colors"
        >
          연동 해제하기
        </button>
      </div>
    </div>
  ) : (
    <div>
      {authCode ? (
        <div className="animate-pulse">
          <p className="text-3xl font-black text-blue-600 tracking-widest mb-2">{authCode}</p>
          <a 
            href={`tg://resolve?domain=Ssagesage_bot&start=${authCode}`}
            target="_blank" 
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs mb-3"
          >
            텔레그램에서 인증하기 🚀
          </a>
        </div>
      ) : (
        <button 
          onClick={generateAuthCode}
          className="text-xs bg-white border border-gray-200 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-100 shadow-sm"
        >
          인증번호 발급받기
        </button>
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