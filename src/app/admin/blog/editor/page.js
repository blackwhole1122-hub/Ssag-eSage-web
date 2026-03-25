'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ── 마크다운 → HTML 변환 (간이)
function markdownToHtml(md) {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" style="max-width:100%" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr />')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|b|i|c|p|u|o|a])(.+)$/gm, '<p>$1</p>');
}

// ── 슬러그 자동 생성
function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

// ── 툴바 버튼 정의
const TOOLBAR = [
  { label: 'B',    wrap: ['**', '**'],   title: '굵게' },
  { label: 'I',    wrap: ['*', '*'],     title: '기울임' },
  { label: 'H2',   prefix: '## ',        title: '제목2' },
  { label: 'H3',   prefix: '### ',       title: '제목3' },
  { label: '`',    wrap: ['`', '`'],     title: '인라인 코드' },
  { label: '💬',   prefix: '> ',         title: '인용' },
  { label: '---',  line: '---',          title: '구분선' },
];

const EMOJIS = ['📝','🔥','💡','🎉','🚀','📦','🛒','💰','⚡','🎯','📊','🔧','✨','🌟','📌','🏷️'];

// ────────────────────────────────────────────────
function BlogEditorInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const [title, setTitle]             = useState('');
  const [slug, setSlug]               = useState('');
  const [slugManual, setSlugManual]   = useState(false);
  const [description, setDescription] = useState('');
  const [content, setContent]         = useState('');
  const [emoji, setEmoji]             = useState('📝');
  const [published, setPublished]     = useState(false);
  const [categoryId, setCategoryId]   = useState('');
  const [categories, setCategories]   = useState([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [showEmoji, setShowEmoji]     = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [loading, setLoading]         = useState(true);
  const [uploading, setUploading]     = useState(false);

  // ── 초기화
  useEffect(() => {
  (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[editor] session:', session); // ← 업로드전 삭제
    if (!session) { router.push('/admin'); return; } 
    // ...
    setLoading(false);
    console.log('[editor] loading done'); // 업로드전 삭제
  })();
}, [editId, router]);

  // ── 제목 → 슬러그 자동
  useEffect(() => {
    if (!slugManual) setSlug(generateSlug(title));
  }, [title, slugManual]);

  // ── 툴바 삽입
  function insertMarkdown(item) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const selected = content.slice(start, end);
    let newText;
    if (item.wrap) {
      newText = content.slice(0, start) + item.wrap[0] + selected + item.wrap[1] + content.slice(end);
    } else if (item.prefix) {
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      newText = content.slice(0, lineStart) + item.prefix + content.slice(lineStart);
    } else if (item.line) {
      newText = content.slice(0, end) + '\n' + item.line + '\n' + content.slice(end);
    }
    setContent(newText);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + (item.wrap ? item.wrap[0].length : item.prefix?.length ?? item.line.length + 2), end + (item.wrap ? item.wrap[0].length : 0)); }, 0);
  }

  // ── 이미지 업로드
  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `blog/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('blog-images').upload(path, file);
    if (error) { alert('업로드 실패: ' + error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('blog-images').getPublicUrl(path);
    setContent(prev => prev + `\n![이미지](${publicUrl})\n`);
    setUploading(false);
    e.target.value = '';
  }

  // ── 저장
  async function handleSave() {
    if (!title.trim() || !slug.trim() || !content.trim())
      return alert('제목, 슬러그, 내용을 모두 입력하세요!');
    setSaving(true);
    const payload = {
      title: title.trim(), slug: slug.trim(),
      description: description.trim(), content,
      emoji, published,
      category_id: categoryId ? Number(categoryId) : null,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    const res = editId
      ? await supabase.from('blog_posts').update(payload).eq('id', editId)
      : await supabase.from('blog_posts').insert({ ...payload, created_at: new Date().toISOString() });
    setSaving(false);
    if (res.error) {
      alert(res.error.code === '23505' ? '이미 존재하는 슬러그입니다.' : '저장 실패: ' + res.error.message);
    } else {
      setSaved(true);
      setTimeout(() => { setSaved(false); router.push('/admin/blog'); }, 1000);
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto min-h-screen flex items-center justify-center text-gray-400 text-sm">
      에디터 준비 중... 🛡️
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen pb-10">
      {/* 헤더 */}
      <header className="bg-white border-b p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/blog')} className="text-gray-400 hover:text-gray-800 text-xl px-1">←</button>
          <h1 className="text-lg font-bold text-gray-800">{editId ? '✏️ 글 수정' : '✍️ 새 글 작성'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(p => !p)}
            className={`text-xs px-4 py-2 rounded-full font-bold transition-colors ${showPreview ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {showPreview ? '✏️ 에디터' : '👁️ 미리보기'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`text-xs px-5 py-2 rounded-full font-bold shadow-sm transition-colors ${saved ? 'bg-green-500 text-white' : saving ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            {saved ? '✅ 저장됨!' : saving ? '저장 중...' : '💾 저장'}
          </button>
        </div>
      </header>

      <main className="p-4 flex flex-col gap-4">

        {/* 기본 정보 */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
          {/* 이모지 + 제목 */}
          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => setShowEmoji(p => !p)}
              className="text-3xl w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-orange-50 transition-colors flex-shrink-0">
              {emoji}
            </button>
            {showEmoji && (
              <div className="absolute top-16 left-0 z-20 bg-white border border-gray-100 rounded-2xl shadow-lg p-3 flex flex-wrap gap-2 w-64">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => { setEmoji(e); setShowEmoji(false); }}
                    className="text-2xl hover:scale-125 transition-transform">{e}</button>
                ))}
              </div>
            )}
            <input
              type="text"
              placeholder="글 제목을 입력하세요"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="flex-1 text-xl font-bold bg-transparent border-none outline-none text-gray-900 placeholder-gray-300"
            />
          </div>

          {/* 슬러그 */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-2.5">
            <span className="text-xs text-gray-400 font-mono flex-shrink-0">/blog/</span>
            <input
              type="text"
              placeholder="slug-url"
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugManual(true); }}
              className="flex-1 text-xs font-mono bg-transparent border-none outline-none text-gray-600"
            />
            <button onClick={() => { setSlug(generateSlug(title)); setSlugManual(false); }}
              className="text-[10px] text-orange-500 hover:text-orange-700 font-bold flex-shrink-0">자동생성</button>
          </div>

          {/* 설명 */}
          <textarea
            placeholder="글 요약 (SEO 설명, 선택사항)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full text-sm bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700 placeholder-gray-300"
          />
        </div>

        {/* 카테고리 + 발행 설정 */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-40">
            <span className="text-xs font-bold text-gray-500">🏷️ 카테고리</span>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="flex-1 text-sm bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700">
              <option value="">미분류</option>
              {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">⏰ 예약발행</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700"
            />
          </div>

          <button
            onClick={() => setPublished(p => !p)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-colors ${published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            <span className={`w-2 h-2 rounded-full ${published ? 'bg-green-500' : 'bg-gray-400'}`} />
            {published ? '공개' : '비공개'}
          </button>
        </div>

        {/* 본문 에디터 / 미리보기 */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {!showPreview ? (
            <>
              {/* 툴바 */}
              <div className="flex items-center gap-1 px-4 py-3 border-b border-gray-50 flex-wrap">
                {TOOLBAR.map(item => (
                  <button key={item.label} title={item.title} onClick={() => insertMarkdown(item)}
                    className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                    {item.label}
                  </button>
                ))}
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  {uploading ? '업로드 중...' : '🖼️ 이미지'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              {/* 텍스트에어리어 */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="마크다운으로 작성하세요...&#10;&#10;# 제목&#10;**굵게** *기울임* `코드`"
                className="w-full h-96 px-5 py-4 text-sm font-mono text-gray-800 resize-none focus:outline-none leading-relaxed placeholder-gray-300"
              />
            </>
          ) : (
            <div
              className="prose prose-sm max-w-none px-6 py-5 min-h-96 text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(content) || '<p class="text-gray-300">내용이 없습니다.</p>' }}
            />
          )}
        </div>

        {/* 하단 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-colors shadow-sm ${saved ? 'bg-green-500 text-white' : saving ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
          {saved ? '✅ 저장 완료!' : saving ? '저장 중...' : editId ? '수정 완료' : '글 발행하기'}
        </button>
      </main>
    </div>
  );
}

export default function BlogEditorPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-400">로딩 중...</div>}>
      <BlogEditorInner />
    </Suspense>
  );
}