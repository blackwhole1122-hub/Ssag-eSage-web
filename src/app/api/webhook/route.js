import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req) {
  try {
    const body = await req.json();
    const { message } = body;
    if (!message || !message.text) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text;

    if (text.startsWith('/인증')) {
      const code = text.trim().split(' ')[1];

      // 1. DB에서 코드 찾기 (일단 시간 체크 빼고 코드만 맞는지 확인!)
      const { data: profile, error: selectError } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_code', code)
        .single();

      if (profile) {
        // 2. 일치하면 Chat ID 저장하고 코드 비우기
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            telegram_chat_id: chatId.toString(),
            auth_code: null,
            auth_code_expires_at: null 
          })
          .eq('id', profile.id);

        if (updateError) {
          // DB 업데이트 실패 시 텔레그램으로 에러 알림
          await sendMsg(chatId, `❌ DB 저장 실패: ${updateError.message}`);
        } else {
          await sendMsg(chatId, "✅ 인증 성공! 이제 마이페이지를 새로고침 해보세요.");
        }
      } else {
        await sendMsg(chatId, "❌ 코드가 틀렸거나 이미 사용되었습니다.");
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: true });
  }
}

// 메시지 전송 함수 분리
async function sendMsg(chatId, text) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
}