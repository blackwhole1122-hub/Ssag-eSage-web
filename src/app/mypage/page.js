'use client'
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function MyPage() {
  const [user, setUser] = useState(null);
  const [telegramId, setTelegramId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [authCode, setAuthCode] = useState('');
  const router = useRouter();

  // ★ 새 키워드 등록 시 채널 선택 상태
  const [newChannels, setNewChannels] = useState({ ssagesage: true, coupang: true });

  const handleDisconnectTelegram = async () => {
    const confirmDisconnect = confirm("정말 텔레그램 연동을 해제하시겠어요? 😢 더 이상 핫딜 알림을 받을 수 없게 됩니다.");
    if (confirmDisconnect) {
      const { error } = await supabase
        .from('profiles')
        .update({ telegram_chat_id: null, auth_code: null, auth_code_expires_at: null })
        .eq('id', user.id);
      if (error) {
        alert('연동 해제 중 오류가 발생했습니다.');
      } else {
        setTelegramId(null);
        setAuthCode('');
        alert('텔레그램 연동이 해제되었습니다! 📴');
      }
    }
  };

  const fetchData = useCallback(async (userId) => {
    const { data: kwData } = await supabase
      .from('user_keywords')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
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

  const generateAuthCode = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        auth_code: code,
        auth_code_expires_at: expiresAt,
        display_name: user.user_metadata?.display_name || '회원'
      });
    if (error) {
      alert('코드 생성 실패 😢');
    } else {
      setAuthCode(code);
      await fetchData(user.id);
    }
  };

  // ★ 키워드 추가 (채널 선택 포함)
  const addKeyword = async () => {
    if (!newKeyword.trim()) return;
    if (keywords.some(k => k.keyword === newKeyword.trim())) {
      alert('이미 등록된 키워드예요! 😊');
      setNewKeyword('');
      return;
    }
    // 채널 배열 구성
    const channels = [];
    if (newChannels.ssagesage) channels.push('ssagesage');
    if (newChannels.coupang) channels.push('coupang');
    if (channels.length === 0) {
      alert('최소 한 개의 알림 채널을 선택해주세요!');
      return;
    }

    const { error } = await supabase
      .from('user_keywords')
      .insert([{ 
        user_id: user.id, 
        keyword: newKeyword.trim(),
        notify_channels: channels,
      }]);
    if (error) {
      alert('키워드 추가 실패 😢');
    } else {
      setNewKeyword('');
      await fetchData(user.id);
    }
  };

  // ★ 키워드별 채널 변경
  const toggleChannel = async (kwId, currentChannels, channel) => {
    const channels = currentChannels || ['ssagesage', 'coupang'];
    let updated;
    if (channels.includes(channel)) {
      updated = channels.filter(c => c !== channel);
    } else {
      updated = [...channels, channel];
    }
    if (updated.length === 0) {
      alert('최소 한 개의 채널은 선택해야 해요!');
      return;
    }
    const { error } = await supabase
      .from('user_keywords')
      .update({ notify_channels: updated })
      .eq('id', kwId);
    if (!error) await fetchData(user.id);
  };

  const deleteKeyword = async (id) => {
    const { error } = await supabase.from('user_keywords').delete().eq('id', id);
    if (!error) await fetchData(user.id);
  };

  const handleWithdrawal = async () => {
    const confirmWithdrawal = confirm("정말 탈퇴하시겠어요? 😭 등록된 키워드와 알림 설정이 모두 삭제됩니다.");
    if (confirmWithdrawal) {
      setLoading(true);
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', user.id);
        if (error) throw error;
        await supabase.auth.signOut();
        alert('그동안 이용해주셔서 감사합니다. 🙇‍♂️');
        router.push('/');
        router.refresh();
      } catch (error) {
        alert('탈퇴 처리 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">확인 중... ⏳</div>;

  return (
    <div className="max-w-2xl mx-auto bg-gray-100 min-h-screen pb-10 p-4 font-sans text-gray-800">
      <div className="flex justify-between items-center mb-2 px-2">
        <button onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-all font-bold text-sm group">
          <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
          <span>싸게사게 홈으로</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm p-8 mt-6">
        <h2 className="text-xl font-bold mb-2">🔔 내 핫딜 알림 설정</h2>
        <p className="text-sm text-gray-500 mb-8">
          반가워요, <span className="font-bold text-gray-800">{user?.user_metadata?.display_name || '회원'}</span>님!
        </p>

        {/* ═══ 키워드 입력 ═══ */}
        <div className="mb-2">
          <div className="flex gap-2 mb-3">
            <input type="text" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
              placeholder="예: 아이폰, 맥북, 플스"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <button onClick={addKeyword} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm">추가</button>
          </div>

          {/* ★ 새 키워드 알림 채널 선택 */}
          <div className="flex items-center gap-3 mb-6 ml-1">
            <span className="text-[11px] text-gray-400 font-bold">알림 받을 곳:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={newChannels.ssagesage}
                onChange={(e) => setNewChannels({...newChannels, ssagesage: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-xs font-medium text-gray-600">🔥 싸게사게</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={newChannels.coupang}
                onChange={(e) => setNewChannels({...newChannels, coupang: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
              <span className="text-xs font-medium text-gray-600">🛒 쿠팡핫딜</span>
            </label>
          </div>
        </div>

        {/* ═══ 등록된 키워드 목록 ═══ */}
        <div className="space-y-3 mb-10">
          <p className="text-xs font-bold text-gray-400 ml-1">등록된 키워드 ({keywords.length})</p>
          {keywords.length === 0 ? (
            <p className="text-sm text-gray-300 text-center py-6">아직 등록된 키워드가 없어요</p>
          ) : (
            <div className="space-y-2">
              {keywords.map((kw) => {
                const channels = kw.notify_channels || ['ssagesage', 'coupang'];
                return (
                  <div key={kw.id}
                    className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100">
                    {/* 키워드명 */}
                    <span className="text-sm font-bold text-gray-700 flex-1 min-w-0 truncate">{kw.keyword}</span>

                    {/* 채널 토글 */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => toggleChannel(kw.id, channels, 'ssagesage')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          channels.includes('ssagesage')
                            ? 'bg-blue-100 text-blue-600 border border-blue-200'
                            : 'bg-gray-100 text-gray-300 border border-gray-100'
                        }`}
                      >
                        싸게사게
                      </button>
                      <button
                        onClick={() => toggleChannel(kw.id, channels, 'coupang')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          channels.includes('coupang')
                            ? 'bg-orange-100 text-orange-600 border border-orange-200'
                            : 'bg-gray-100 text-gray-300 border border-gray-100'
                        }`}
                      >
                        쿠팡
                      </button>
                    </div>

                    {/* 삭제 */}
                    <button onClick={() => deleteKeyword(kw.id)}
                      className="text-gray-300 hover:text-red-500 font-bold text-sm flex-shrink-0 ml-1">✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══ 텔레그램 연동 ═══ */}
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-10 text-center">
          <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">텔레그램 알림 설정</p>
          {telegramId ? (
            <div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-bold text-green-500 flex items-center gap-1">
                  <span className="text-lg">✅</span> 연동 완료
                </p>
                <p className="text-[10px] text-gray-400 mb-4">Chat ID: {telegramId}</p>
                <button onClick={handleDisconnectTelegram}
                  className="text-[11px] text-gray-400 hover:text-red-400 underline underline-offset-4 transition-colors">
                  연동 해제하기
                </button>
              </div>
            </div>
          ) : (
            <div>
              {authCode ? (
                <div className="animate-pulse">
                  <p className="text-3xl font-black text-blue-600 tracking-widest mb-2">{authCode}</p>
                  <a href={`tg://resolve?domain=Ssagesage_bot&start=${authCode}`}
                    target="_blank"
                    className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs mb-3">
                    텔레그램에서 인증하기 🚀
                  </a>
                </div>
              ) : (
                <button onClick={generateAuthCode}
                  className="text-xs bg-white border border-gray-200 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-100 shadow-sm">
                  인증번호 발급받기
                </button>
              )}
            </div>
          )}
        </div>

        {/* ═══ 하단 버튼 ═══ */}
        <div className="flex items-center justify-between border-t pt-6">
          <button onClick={handleWithdrawal} className="text-xs text-red-400 hover:text-red-600 underline decoration-red-200 underline-offset-4">회원탈퇴</button>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); router.refresh(); }}
            className="text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors">로그아웃</button>
        </div>
      </div>
    </div>
  );
}
