import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req) {
  try {
    const body = await req.json();
    const { message } = body;

    // 텍스트 메시지가 아니면 무시
    if (!message || !message.text) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text.trim();

    // 1. '/인증' 또는 '/start'로 시작하는지 확인
    if (text.startsWith('/인증') || text.startsWith('/start')) {
      const parts = text.split(' ');
      const code = parts[1]; // 두 번째 단어(인증번호) 추출

      // 번호가 없을 때 (그냥 /start 만 눌렀을 때)
      if (!code) {
        await sendMsg(chatId, "반가워요! 웹사이트에서 발급받은 인증번호를 입력해주세요.\n예: /인증 123456");
        return NextResponse.json({ ok: true });
      }

      // 2. DB에서 해당 코드를 가진 유저 찾기
      const { data: profile, error: selectError } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_code', code)
        .single();

      if (profile) {
        // 3. 일치하면 Chat ID 저장하고 인증 정보 초기화
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            telegram_chat_id: chatId.toString(),
            auth_code: null,
            auth_code_expires_at: null 
          })
          .eq('id', profile.id);

        if (updateError) {
          await sendMsg(chatId, `❌ 저장 실패: ${updateError.message}`);
        } else {
          await sendMsg(chatId, "✅ 연동 성공! 이제 핫딜 알림을 보내드릴게요.");
        }
      } else {
        // 코드가 없거나 틀렸을 때
        await sendMsg(chatId, "❌ 코드가 틀렸거나 만료되었습니다. 번호를 다시 확인해주세요.");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('🔥 Webhook 에러:', err);
    return NextResponse.json({ ok: true });
  }
}

// 텔레그램 메시지 전송 함수
async function sendMsg(chatId, text) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
}
