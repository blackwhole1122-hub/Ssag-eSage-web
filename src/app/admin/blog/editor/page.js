// ============================================
// 📁 파일 위치: app/admin/blog/editor/page.js
// ============================================
'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function markdownToHtml(md) {
  let html = md;
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    return `<pre class="md-codeblock"><code class="language-${lang}">${code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
  });
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="md-link" target="_blank" rel="noopener">$1</a>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  html = html.replace(/^> (.+)$/gm, '<blockquote class="md-quote">$1</blockquote>');
  html = html.replace(/^- (.+)$/gm, '<li class="md-li">$1</li>');
  html = html.replace(/((?:<li class="md-li">.*<\/li>\n?)+)/g, '<ul class="md-ul">$1</ul>');
  html = html.replace(/^---$/gm, '<hr class="md-hr" />');
  html = html.split('\n\n').map(block => {
    const t = block.trim();
    if (!t) return '';
    if (/^<(h[1-6]|pre|ul|blockquote|hr|img)/.test(t)) return t;
    return `<p class="md-p">${t.replace(/\n/g, '<br />')}</p>`;
  }).join('\n');
  return html;
}

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9가-힣\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

const TOOLBAR_ITEMS = [
  { label: 'H1', prefix: '# ', suffix: '', icon: 'H1' },
  { label: 'H2', prefix: '## ', suffix: '', icon: 'H2' },
  { label: 'H3', prefix: '### ', suffix: '', icon: 'H3' },
  { label: '|', prefix: '', suffix: '', icon: 'divider' },
  { label: 'Bold', prefix: '**', suffix: '**', icon: 'B' },
  { label: 'Italic', prefix: '*', suffix: '*', icon: 'I' },
  { label: 'Strike', prefix: '~~', suffix: '~~', icon: 'S' },
  { label: '|', prefix: '', suffix: '', icon: 'divider' },
  { label: 'Link', prefix: '[', suffix: '](url)', icon: '🔗' },
  { label: 'Code', prefix: '`', suffix: '`', icon: '</>' },
  { label: 'CodeBlock', prefix: '```\n', suffix: '\n```', icon: '{ }' },
  { label: '|', prefix: '', suffix: '', icon: 'divider' },
  { label: 'Quote', prefix: '> ', suffix: '', icon: '❝' },
  { label: 'List', prefix: '- ', suffix: '', icon: '•' },
  { label: 'HR', prefix: '\n---\n', suffix: '', icon: '―' },
];

const EMOJI_OPTIONS = [
  '📝', '🔥', '💡', '🚀', '💰', '🛒', '📊', '🎯',
  '⚡', '🏷️', '📱', '🖥️', '🎮', '🍔', '✈️', '🏠',
  '💳', '🎁', '📦', '🔍', '❤️', '⭐', '🌟', '💎',
];

function BlogEditorInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [emoji, setEmoji] = useState('📝');
  const [published, setPublished] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingPost, setLoadingPost] = useState(!!editId);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('blog_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (data) setCategories(data);
    })();
  }, []);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data } = await supabase.from('blog_posts').select('*').eq('id', editId).single();
      if (data) {
        setTitle(data.title || '');
        setSlug(data.slug || '');
        setSlugManual(true);
        setDescription(data.description || '');
        setContent(data.content || '');
        setEmoji(data.emoji || '📝');
        setPublished(data.published || false);
        setCategoryId(data.category_id ? String(data.category_id) : '');
        // 예약 시간 로드 (ISO → datetime-local 형식)
        if (data.scheduled_at) {
          const d = new Date(data.scheduled_at);
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setScheduledAt(local);
        }
      }
      setLoadingPost(false);
    })();
  }, [editId]);

  useEffect(() => {
    if (!slugManual && title) setSlug(generateSlug(title));
  }, [title, slugManual]);

  const insertMarkdown = useCallback((prefix, suffix) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const before = content.slice(0, start);
    const after = content.slice(end);
    const inserted = `${prefix}${selected || '텍스트'}${suffix}`;
    setContent(`${before}${inserted}${after}`);
    setTimeout(() => {
      ta.focus();
      const cursorPos = start + prefix.length;
      ta.setSelectionRange(cursorPos, cursorPos + (selected || '텍스트').length);
    }, 0);
  }, [content]);

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('JPG, PNG, GIF, WEBP 이미지만 업로드할 수 있어요!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하만 가능해요!');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `blog/${fileName}`;
    const { error } = await supabase.storage.from('blog-images').upload(filePath, file);
    setUploading(false);
    if (error) {
      alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
      if (process.env.NODE_ENV === 'development') console.error('[Image Upload Error]', error);
      return;
    }
    const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(filePath);
    const ta = textareaRef.current;
    const cursorPos = ta ? ta.selectionStart : content.length;
    const before = content.slice(0, cursorPos);
    const after = content.slice(cursorPos);
    setContent(`${before}\n![${file.name}](${urlData.publicUrl})\n${after}`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload({ target: { files: [file] } });
    }
  }

  function handleDragOver(e) { e.preventDefault(); }

  function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleImageUpload({ target: { files: [file] } });
        break;
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      setContent(content.slice(0, start) + '  ' + content.slice(ta.selectionEnd));
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 2; }, 0);
    }
  };

  // 발행 상태 텍스트
  function getPublishLabel() {
    if (!published) return '📌 비공개';
    if (scheduledAt && new Date(scheduledAt) > new Date()) return '⏰ 예약됨';
    return '✅ 게시';
  }

  async function handleSave() {
    if (!title.trim()) return alert('제목을 입력해주세요!');
    if (!slug.trim()) return alert('슬러그를 입력해주세요!');
    if (!content.trim()) return alert('내용을 입력해주세요!');

    setSaving(true);
    const postData = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim(),
      content,
      emoji,
      published,
      category_id: categoryId ? Number(categoryId) : null,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from('blog_posts').update(postData).eq('id', editId));
    } else {
      ({ error } = await supabase.from('blog_posts').insert({ ...postData, created_at: new Date().toISOString() }));
    }
    setSaving(false);

    if (error) {
      if (error.code === '23505') {
        alert('이미 같은 슬러그의 글이 있어요!');
      } else {
        alert('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
        if (process.env.NODE_ENV === 'development') console.error('[Blog Save Error]', error);
      }
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (!editId) router.push('/admin/blog');
  }

  if (loadingPost) {
    return <div className="max-w-4xl mx-auto bg-gray-100 min-h-screen flex items-center justify-center text-gray-400 text-sm">글 불러오는 중...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto bg-gray-100 min-h-screen pb-10">
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageUpload} className="hidden" />

      {/* 헤더 */}
      <header className="bg-white border-b p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/blog')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← 목록</button>
          <div className="w-px h-5 bg-gray-200"></div>
          <span className="text-sm font-bold text-gray-800">{editId ? '글 수정' : '새 글 작성'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(!showPreview)} className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${showPreview ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            👁️ 미리보기
          </button>
          <button onClick={() => setPublished(!published)} className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${published ? (scheduledAt && new Date(scheduledAt) > new Date() ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700') : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {getPublishLabel()}
          </button>
          <button onClick={handleSave} disabled={saving} className={`text-xs px-4 py-1.5 rounded-full font-bold transition-all ${saved ? 'bg-green-500 text-white' : saving ? 'bg-blue-400 text-white cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            {saved ? '✓ 저장됨' : saving ? '저장 중...' : '💾 저장'}
          </button>
        </div>
      </header>

      <main className="p-4 flex flex-col gap-4">
        {/* 메타 정보 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start gap-3">
            <div className="relative">
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-14 h-14 text-3xl bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center">
                {emoji}
              </button>
              {showEmojiPicker && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-xl border border-gray-200 shadow-lg z-20 grid grid-cols-6 gap-2 w-64">
                  {EMOJI_OPTIONS.map(e => (
                    <button key={e} onClick={() => { setEmoji(e); setShowEmojiPicker(false); }} className="text-2xl p-1.5 hover:bg-gray-100 rounded-lg transition-colors">{e}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-3">
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="글 제목을 입력하세요"
                className="w-full px-3 py-2.5 text-base font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />

              <div className="grid grid-cols-2 gap-2">
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                  className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700">
                  <option value="">카테고리 선택</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                  ))}
                </select>
                <div className="flex items-center">
                  <span className="text-xs text-gray-400 px-3 py-2 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl">/blog/</span>
                  <input type="text" value={slug} onChange={e => { setSlug(e.target.value); setSlugManual(true); }} placeholder="my-post-slug"
                    className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="SEO 설명 (검색 결과에 표시, 150자 이내 권장)" maxLength={160}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-300 mt-1 text-right">{description.length}/160</p>
              </div>

              {/* 예약 발행 */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 flex-shrink-0">⏰ 예약 발행:</span>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                />
                {scheduledAt && (
                  <button
                    onClick={() => setScheduledAt('')}
                    className="text-xs text-red-400 hover:text-red-600 px-2 py-1 flex-shrink-0"
                  >
                    취소
                  </button>
                )}
              </div>
              {scheduledAt && new Date(scheduledAt) > new Date() && published && (
                <p className="text-xs text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-lg">
                  ⏰ {new Date(scheduledAt).toLocaleString('ko-KR')} 에 자동으로 공개됩니다
                </p>
              )}
              {scheduledAt && new Date(scheduledAt) <= new Date() && published && (
                <p className="text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                  ✅ 예약 시간이 지나서 이미 공개 중입니다
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 에디터 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-100 bg-gray-50">
            {TOOLBAR_ITEMS.map((item, i) =>
              item.icon === 'divider' ? (
                <div key={i} className="w-px h-5 bg-gray-200 mx-1" />
              ) : (
                <button key={i} onClick={() => insertMarkdown(item.prefix, item.suffix)} title={item.label}
                  className="px-2 py-1.5 text-xs font-mono text-gray-600 hover:bg-white hover:text-blue-600 rounded transition-colors">{item.icon}</button>
              )
            )}
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} title="이미지 업로드"
              className={`px-2 py-1.5 text-xs font-mono rounded transition-colors ${uploading ? 'text-blue-400 bg-blue-50 cursor-wait' : 'text-gray-600 hover:bg-white hover:text-blue-600'}`}>
              {uploading ? '⏳' : '🖼️'}
            </button>
          </div>

          {uploading && (
            <div className="px-4 py-2 bg-blue-50 text-xs text-blue-600 flex items-center gap-2">
              <span className="animate-spin">⏳</span> 이미지 업로드 중...
            </div>
          )}

          <textarea ref={textareaRef} value={content} onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown} onPaste={handlePaste} onDrop={handleDrop} onDragOver={handleDragOver}
            placeholder={`마크다운으로 작성하세요...\n\n# 제목\n## 소제목\n\n**굵게**, *기울임*\n\n- 리스트 항목\n> 인용문\n\n🖼️ 이미지: 툴바 버튼 클릭, 드래그앤드롭, 또는 Ctrl+V 붙여넣기`}
            className="w-full min-h-[500px] p-4 text-sm font-mono leading-relaxed resize-y focus:outline-none placeholder:text-gray-300" spellCheck={false} />

          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
            <span>마크다운 · 이미지: 버튼 / 드래그 / 붙여넣기</span>
            <span>{content.length}자 · 약 {Math.ceil(content.length / 500)}분 읽기</span>
          </div>
        </div>

        {/* 미리보기 */}
        {showPreview && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <span className="text-xs font-bold text-gray-500">📖 미리보기</span>
            </div>
            <div className="p-5">
              <div className="mb-6 pb-6 border-b border-gray-100">
                <div className="text-4xl mb-3">{emoji}</div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">{title || '제목 없음'}</h1>
                {categoryId && (
                  <span className="inline-block text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full mb-2">
                    {categories.find(c => String(c.id) === categoryId)?.name || ''}
                  </span>
                )}
                {description && <p className="text-sm text-gray-500">{description}</p>}
              </div>
              <div className="
                [&_.md-h1]:text-xl [&_.md-h1]:font-bold [&_.md-h1]:mt-8 [&_.md-h1]:mb-4 [&_.md-h1]:text-gray-900
                [&_.md-h2]:text-lg [&_.md-h2]:font-bold [&_.md-h2]:mt-6 [&_.md-h2]:mb-3 [&_.md-h2]:text-gray-900
                [&_.md-h3]:text-base [&_.md-h3]:font-semibold [&_.md-h3]:mt-5 [&_.md-h3]:mb-2 [&_.md-h3]:text-gray-800
                [&_.md-p]:text-gray-700 [&_.md-p]:leading-7 [&_.md-p]:mb-4 [&_.md-p]:text-sm
                [&_.md-link]:text-blue-600 [&_.md-link]:underline
                [&_.md-img]:rounded-xl [&_.md-img]:my-4 [&_.md-img]:max-w-full
                [&_.md-quote]:border-l-4 [&_.md-quote]:border-blue-300 [&_.md-quote]:pl-4 [&_.md-quote]:text-gray-600 [&_.md-quote]:italic [&_.md-quote]:my-4 [&_.md-quote]:bg-blue-50 [&_.md-quote]:py-2 [&_.md-quote]:pr-3 [&_.md-quote]:rounded-r-lg
                [&_.md-ul]:list-disc [&_.md-ul]:pl-6 [&_.md-ul]:my-4
                [&_.md-li]:text-gray-700 [&_.md-li]:mb-1 [&_.md-li]:text-sm
                [&_.md-codeblock]:bg-gray-900 [&_.md-codeblock]:text-green-300 [&_.md-codeblock]:p-4 [&_.md-codeblock]:rounded-xl [&_.md-codeblock]:overflow-x-auto [&_.md-codeblock]:text-xs [&_.md-codeblock]:my-4
                [&_.md-inline-code]:bg-gray-100 [&_.md-inline-code]:text-pink-600 [&_.md-inline-code]:px-1.5 [&_.md-inline-code]:py-0.5 [&_.md-inline-code]:rounded [&_.md-inline-code]:text-xs
                [&_.md-hr]:border-gray-200 [&_.md-hr]:my-6"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(content) || '<p class="text-gray-300 text-sm">내용을 입력하면 여기에 미리보기가 표시됩니다</p>' }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function BlogEditorPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-400 text-sm">로딩 중...</div>}>
      <BlogEditorInner />
    </Suspense>
  );
}