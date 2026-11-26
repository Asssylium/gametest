import { useState } from 'react';

// 1. Sinh 20.000 data giả (để ngoài component để chỉ tạo 1 lần)
const MOCK_GAMES = Array.from({ length: 20000 }, (_, i) => ({
  id: i,
  title: `Game số ${i} - ${Math.random().toString(36).substring(7)}`,
}));

export default function TestPerformance() {
  const [keyword, setKeyword] = useState('');

  // 2. Đo thời gian chạy logic filter bằng console.time
  console.time('⏱️ Thời gian Filter 20k dòng');
  const filtered = MOCK_GAMES.filter((g) => g.title.toLowerCase().includes(keyword.toLowerCase()));
  console.timeEnd('⏱️ Thời gian Filter 20k dòng');

  return (
    <div style={{ padding: '20px' }}>
      <h3>Test 20.000 Games</h3>
      <input
        type="text"
        placeholder="Gõ tìm kiếm..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ padding: '10px', width: '300px', marginBottom: '20px' }}
      />

      {/* 3. Render toàn bộ 20.000 phần tử ra màn hình */}
      <div style={{ height: '400px', overflowY: 'auto', border: '1px solid black' }}>
        {filtered.map((game) => (
          <div key={game.id} style={{ padding: '5px', borderBottom: '1px solid #eee' }}>
            {game.title}
          </div>
        ))}
      </div>
    </div>
  );
}
