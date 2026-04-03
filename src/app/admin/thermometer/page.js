'use client'
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ThermometerAdmin() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // 1. 품목 리스트 가져오기
  useEffect(() => {
    async function fetchGroups() {
      const { data, error } = await supabase
        .from('keyword_groups')
        .select('*')
        .order('group_name', { ascending: true });
      if (data) setGroups(data);
    }
    fetchGroups();
  }, []);

  // 검색 필터링
  const filteredGroups = groups.filter(g => 
    g.group_name.includes(searchTerm) || g.slug.includes(searchTerm)
  );

  // 파일 선택 핸들러
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setMessage({ text: "", type: "" });
  };

  // 업로드 실행
  const handleUpload = async () => {
    if (!selectedGroup || !file) {
      setMessage({ text: "품목을 선택하고 파일을 추가해주세요!", type: "error" });
      return;
    }

    setUploading(true);
    const fileExt = "png"; // 킴님 사이트 규칙에 따라 png로 고정
    const fileName = `${selectedGroup.slug}.${fileExt}`;
    const filePath = fileName;

    try {
      // 🌟 Supabase Storage 업로드 (upsert: true로 기존 파일 덮어쓰기 가능)
      const { error: uploadError } = await supabase.storage
        .from('thermometer')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      setMessage({ text: `[${selectedGroup.group_name}] 이미지 업로드 성공!`, type: "success" });
      setFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error(error);
      setMessage({ text: "업로드 중 오류가 발생했습니다.", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen pb-10">
      <header className="bg-white border-b p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-800">←</button>
          <h1 className="text-lg font-bold text-gray-800">🌡️ 온도계 이미지 관리</h1>
        </div>
      </header>

      <main className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 왼쪽: 품목 선택 리스트 */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
          <h2 className="font-bold text-gray-700">1. 품목 선택</h2>
          <input 
            type="text" 
            placeholder="품목명 검색..." 
            className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="h-[400px] overflow-y-auto border border-gray-50 rounded-xl p-2 space-y-1">
            {filteredGroups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className={`w-full text-left p-3 rounded-xl text-sm transition-all ${
                  selectedGroup?.slug === group.slug 
                    ? 'bg-blue-500 text-white font-bold shadow-md' 
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                {group.group_name} <span className="text-[10px] opacity-60 ml-1">({group.slug})</span>
              </button>
            ))}
          </div>
        </div>

        {/* 오른쪽: 업로드 영역 */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
          <h2 className="font-bold text-gray-700">2. 이미지 업로드</h2>
          
          {selectedGroup ? (
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-xs text-blue-600 font-bold">선택된 품목</p>
                <p className="text-lg font-black text-blue-800">{selectedGroup.group_name}</p>
                <p className="text-[10px] text-blue-400">파일명: {selectedGroup.slug}.png</p>
              </div>

              {/* 드롭존 / 파일선택 */}
              <div className="relative border-2 border-dashed border-gray-200 rounded-3xl h-48 flex flex-col items-center justify-center gap-3 overflow-hidden group">
                {previewUrl ? (
                  <img src={previewUrl} className="w-full h-full object-contain p-4" alt="미리보기" />
                ) : (
                  <>
                    <span className="text-4xl">📸</span>
                    <p className="text-xs text-gray-400">클릭하거나 이미지를 드래그하세요</p>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              {message.text && (
                <p className={`text-xs font-bold text-center ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                  {message.text}
                </p>
              )}

              <button 
                onClick={handleUpload}
                disabled={uploading || !file}
                className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-lg ${
                  uploading || !file ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                }`}
              >
                {uploading ? "업로드 중..." : "이미지 저장하기"}
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
              <span className="text-4xl">👈</span>
              <p className="text-sm">왼쪽에서 품목을 먼저 선택해주세요</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}