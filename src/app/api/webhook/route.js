import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message || !message.text) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text;

    // 1. '/인증 123456' 형태인지 확인
    if (text.startsWith('/인증')) {
      const code = text.split(' ')[1];

      // 2. DB에서 해당 코드를 가진 유저 찾기 (만료 시간도 체크)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_code', code)
        .gt('auth_code_expires_at', new Date().toISOString())
        .single();

      if (profile) {
        // 3. 일치하면 Chat ID 저장하고 인증코드 초기화
        await supabase
          .from('profiles')
          .update({ 
            telegram_chat_id: chatId.toString(),
            auth_code: null,
            auth_code_expires_at: null 
          })
          .eq('id', profile.id);

        // 4. 유저에게 성공 메시지 전송
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: "✅ 인증 성공! 이제 핫딜 알림을 보내드릴게요." })
        });
      } else {
        // 인증 실패 메시지
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: "❌ 코드가 틀렸거나 만료되었습니다. 다시 시도해주세요." })
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: true }); // 에러가 나도 텔레그램에겐 성공했다고 해야 무한 재전송을 안 합니다.
  }
}