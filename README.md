# Mentor_NodeReact – Game Catalog

Project mẫu để mentor intern: **Node.js (Express) API** + **React (Vite) frontend**.
Nghiệp vụ là một catalog game thu nhỏ (vendor, game, bật/tắt, sắp xếp, tên tiếng Nhật), gần với dự án thật GamesPlatform để intern dễ chuyển sang sau này.

Database: **MySQL** (database `mentor_game`), kết nối qua thư viện `mysql2`. Test chạy trên database riêng `mentor_game_test`, bị reset trước mỗi test.

## Yêu cầu

- Node.js >= 20 (`node -v`)
- MySQL 8 đang chạy ở `127.0.0.1:3306`

## Tạo database (làm 1 lần)

Dùng chung MySQL và user với GamesPlatform_Backend (user `huonght`, không mật khẩu).

```bash
cd server
npm install
cp .env.example .env          # cấu hình DB, cùng key DB_* như bên Laravel

# Tạo database mentor_game và mentor_game_test
mysql -uhuonght -h127.0.0.1 < db/setup.sql

# Tạo bảng + nạp dữ liệu mẫu (chạy lại bất cứ lúc nào để về dữ liệu gốc)
npm run db:reset
```

| Host      | Port | User    | Password | Database    |
| --------- | ---- | ------- | -------- | ----------- |
| 127.0.0.1 | 3306 | huonght | (trống)  | mentor_game |

**Kết nối bằng MySQL Workbench:** dùng luôn connection đang mở DB của GamesPlatform (hoặc tạo mới: Hostname `127.0.0.1`, Port `3306`, Username `huonght`, không mật khẩu), rồi chọn schema `mentor_game` để xem bảng `vendors` và `games` (bấm Refresh nếu chưa thấy).

## Chạy project

Mở 2 terminal:

```bash
# Terminal 1 – API (http://localhost:3001)
cd server
npm install
npm run dev        # tự restart khi sửa code

# Terminal 2 – Frontend (http://localhost:5173)
cd client
cp .env.example .env   # cổng client + địa chỉ API (lần đầu)
npm install
npm run dev
```

Mở http://localhost:5173. Frontend gọi `/api/...`, Vite proxy sang server cổng 3001.

Chạy test API:

```bash
cd server
npm test
```

## Cấu trúc

```
server/
  src/
    index.js              # khởi động server
    app.js                # tạo Express app, nối các tầng với nhau
    config.js             # cấu hình (đọc server/.env: port, kết nối DB)
    db/database.js        # tạo connection pool, reset bảng + seed
    db/reset.js           # lệnh npm run db:reset
    routes/               # khai báo URL -> hàm controller
    controllers/          # đọc request, gọi service, trả response
    services/             # nghiệp vụ: lọc, phân trang, validate
    repositories/         # truy cập dữ liệu (query MySQL)
    middlewares/          # log request, xử lý lỗi chung
    utils/                # httpError (lỗi kèm HTTP status), validation, asyncHandler
    data/seed.js          # dữ liệu mẫu
  .env.example            # mẫu cấu hình DB (copy thành .env)
  db/setup.sql            # tạo database
  db/schema.sql           # định nghĩa bảng
  tests/                  # test API + DB bằng node:test

client/
  .env.example            # mẫu cấu hình (CLIENT_PORT, API_URL)
  src/
    App.jsx               # menu sidebar + chọn trang đang hiển thị
    layout/               # Layout, Header, Sidebar (khung chung)
    pages/GamesPage.jsx   # màn hình game, giữ state filter/trang
    pages/PlaceholderPage.jsx # trang tạm cho menu chưa làm
    api/client.js         # mọi lời gọi API đi qua đây
    hooks/useGames.js     # load danh sách game theo filter
    hooks/useDebounce.js  # tránh gọi API mỗi lần gõ phím
    components/           # GameTable, GameFilters, Pagination, CreateGameForm
                          # + dùng chung: InlineEdit, Notice, VendorOptions
    constants.js          # GAME_TYPES dùng chung
```

### Luồng một request

```
React component -> api/client.js -> (Vite proxy) -> routes -> controller -> service -> repository
                                                                    ^ lỗi throw HttpError -> errorHandler -> JSON { message, errors }
```

Quy tắc chia tầng (giống Repository/Controller bên Laravel):

- **Controller** không chứa nghiệp vụ, chỉ nhận/trả HTTP.
- **Service** chứa mọi quy tắc nghiệp vụ và validate.
- **Repository** chỉ đọc/ghi dữ liệu. Đổi cách lưu dữ liệu (DB khác, cache...) thì chỉ sửa tầng này.

## Database

| Bảng      | Cột chính                                                                                                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vendors` | `code` (PK), `name`                                                                                                                                                                            |
| `games`   | `id` (PK, autoincrement), `vendor_code` (FK → vendors), `game_code`, `title`, `title_jp`, `type` (SLOT/LIVE/TABLE), `active` (0/1), `sort`, `created_at` – unique (`vendor_code`, `game_code`) |

Định nghĩa đầy đủ ở `server/db/schema.sql`.

## API

| Method | URL                                                              | Mô tả                                                           |
| ------ | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| GET    | `/api/health`                                                    | Kiểm tra server                                                 |
| GET    | `/api/vendors`                                                   | Danh sách vendor                                                |
| GET    | `/api/games?search=&vendor=&active=&page=&limit=&sortBy=&order=` | Danh sách game có lọc + phân trang                              |
| GET    | `/api/games/:id`                                                 | Chi tiết game                                                   |
| POST   | `/api/games`                                                     | Tạo game `{ vendorCode, gameCode, title, type }` (mặc định tắt) |
| PATCH  | `/api/games/:id`                                                 | Sửa `active`, `sort`, `titleJp` (field khác bị bỏ qua)          |

Lỗi trả về dạng `{ "message": "...", "errors": { "field": "..." } }` với status 400/404/409/500.

## Quy chuẩn coding

Các quy tắc dưới đây được rút ra từ chính code trong project. Khi phân vân, mở file tương tự đã có và làm giống vậy.

### Chung (cả server và client)

**Format – do Prettier tự làm**

- Cấu hình chung cho cả server và client ở `.prettierrc.json` (thư mục gốc): 2 space, nháy đơn `'`, có `;`, dấu phẩy cuối (`es5`), dòng tối đa 120 ký tự.
- **VS Code:** cài extension _Prettier – Code formatter_ (VS Code sẽ gợi ý khi mở project). File tự format mỗi lần lưu nhờ `.vscode/settings.json`.
- **Dòng lệnh** (chạy trong `server/` hoặc `client/`):
  - `npm run format`: format lại toàn bộ code.
  - `npm run format:check`: chỉ kiểm tra, báo file nào chưa đúng (dùng trước khi nhờ review).
- Không tự chỉnh tay cách xuống dòng hay khoảng trắng mà Prettier đã format, không sửa `.prettierrc.json` khi chưa hỏi mentor.
- Dùng `import`/`export` (ES Modules), không dùng `require`. Import file nội bộ phải ghi đuôi `.js` / `.jsx`.
- Dùng `const`; chỉ dùng `let` khi biến thực sự bị gán lại. Không dùng `var`.
- So sánh bằng `===` / `!==`.
- Dùng `async/await` thay cho chuỗi `.then()` lồng nhau.

**Đặt tên**

| Loại                            | Quy tắc                             | Ví dụ                                       |
| ------------------------------- | ----------------------------------- | ------------------------------------------- |
| Biến, hàm                       | camelCase, hàm bắt đầu bằng động từ | `findById`, `toPositiveInt`, `handleUpdate` |
| Hằng số cố định                 | UPPER_SNAKE_CASE                    | `GAME_TYPES`, `PAGE_SIZE`                   |
| React component, file component | PascalCase                          | `GameTable.jsx`                             |
| Hook                            | bắt đầu bằng `use`                  | `useGames`, `useDebounce`                   |
| File JS thường                  | camelCase                           | `gameService.js`, `httpError.js`            |
| Cột database                    | snake_case                          | `vendor_code`, `created_at`                 |
| Field trong API / JSON          | camelCase                           | `vendorCode`, `createdAt`                   |
| Boolean                         | đọc như câu hỏi đúng/sai            | `active`, `loading`, `vendorExists`         |

**Comment**

- Viết bằng **tiếng Anh**, 1–2 dòng phía trên hàm / khối code, giải thích **mục đích** hoặc **lý do**, không lặp lại code.
- Không để code bị comment-out, `console.log` debug hay `TODO` không có tên người phụ trách.

```js
// ✅ Explains why
// Set once Enter/Escape closed the input so the blur that follows doesn't save a second time.

// ❌ Repeats the code
// set closed to true
```

**Code dùng chung**

- Đoạn code giống nhau xuất hiện **từ lần thứ 2** thì tách ra dùng chung:
  - Server: `src/utils/`
  - Client: `src/components/` (UI), `src/hooks/` (logic có state), `src/constants.js` (hằng số).
- Không ghi cứng (hard-code) cấu hình như port, URL, tài khoản DB trong code: đặt vào `.env` và cập nhật `.env.example`.
- Không commit `.env`, mật khẩu, token.

### Node.js (server)

**Chia tầng – mỗi tầng một việc**

| Tầng            | Được làm                                                   | Không được làm               |
| --------------- | ---------------------------------------------------------- | ---------------------------- |
| `routes/`       | Khai báo URL → hàm controller, bọc `asyncHandler`          | Logic, query                 |
| `controllers/`  | Đọc `req` (params, query, body), gọi service, trả `res`    | Validate nghiệp vụ, query DB |
| `services/`     | Validate, quy tắc nghiệp vụ, quyết định lỗi 400/404/409    | Đụng `req`/`res`, viết SQL   |
| `repositories/` | Viết SQL, đổi row DB ↔ object (`snake_case` ↔ `camelCase`) | Validate, throw `HttpError`  |

Mỗi tầng được tạo bằng hàm `createXxx(dependency)` và nối với nhau trong `app.js`. Nhờ vậy test có thể truyền vào database khác.

**Route và controller**

- Mọi handler `async` phải được bọc bằng `asyncHandler`, nếu không lỗi sẽ không tới được `errorHandler` và request bị treo.
- URL dạng danh từ số nhiều, dùng đúng method: `GET /api/games`, `POST /api/games`, `PATCH /api/games/:id`.
- Response thành công: `{ data }`, danh sách thêm `{ data, meta }`. Tạo mới trả status `201`.

```js
// routes/games.js
router.patch('/:id', asyncHandler(controller.update));

// controllers/gameController.js
async update(req, res) {
  res.json({ data: await service.update(parseId(req.params.id), req.body ?? {}) });
},
```

**Validate và lỗi**

- Validate toàn bộ input trong service **trước khi** đụng database. Gom lỗi theo từng field rồi gọi `assertValid(errors)` để trả tất cả lỗi một lần.
- Chỉ throw lỗi qua helper trong `utils/httpError.js`: `badRequest` (400), `notFoundError` (404), `conflict` (409). Không tự gọi `res.status(...)` trong service.
- Không trả lỗi nội bộ (stack trace, câu SQL) ra client. `errorHandler` sẽ tự trả `500 Internal server error` và log lỗi ở server.
- Chỉ nhận các field được phép sửa (whitelist), bỏ qua phần còn lại. Ví dụ `PATCH` chỉ nhận `active`, `sort`, `titleJp`.

```js
const errors = {};
if (!title) errors.title = 'Title is required';
if (!GAME_TYPES.includes(input.type)) errors.type = 'Type must be one of ...';
assertValid(errors); // 400 { message, errors: { title, type } }
```

**Database (MySQL)**

- **Luôn dùng tham số `?`**, không bao giờ nối chuỗi giá trị người dùng vào SQL (chống SQL injection).
- Tên cột / chiều sắp xếp lấy từ người dùng phải đi qua whitelist (xem `SORTABLE_COLUMNS`).
- Lọc, sắp xếp, phân trang làm trong SQL (`WHERE`, `ORDER BY`, `LIMIT`), không lấy hết bảng lên rồi lọc bằng JS.
- Chỉ `SELECT` các cột cần dùng, không `SELECT *`.
- Thay đổi cấu trúc bảng thì sửa `db/schema.sql`, cập nhật dữ liệu mẫu trong `data/seed.js` nếu cần, rồi chạy `npm run db:reset`.
- Các query độc lập với nhau thì chạy song song bằng `Promise.all`.

```js
// ✅
pool.query('SELECT ... FROM games WHERE vendor_code = ?', [vendorCode]);
// ❌ SQL injection
pool.query(`SELECT ... FROM games WHERE vendor_code = '${vendorCode}'`);
```

**Test**

- API mới hoặc thay đổi hành vi phải có test trong `server/tests/`: ít nhất 1 trường hợp thành công và 1 trường hợp lỗi (400/404/409).
- Test chạy trên DB `mentor_game_test`, được reset trước mỗi test. Không viết test phụ thuộc thứ tự chạy hay dữ liệu do test khác tạo ra.

### React (client)

**Component**

- Chỉ dùng function component, mỗi file một component chính, `export default`.
- Component nhỏ và làm một việc. File dài quá ~150 dòng hoặc có phần dùng lại được thì tách ra.
- Phân loại thư mục:
  - `pages/`: màn hình, giữ state và gọi API.
  - `components/`: phần UI nhận dữ liệu qua props, càng ít state càng tốt.
  - `layout/`: khung chung (Header, Sidebar).
- Props callback đặt tên `onXxx` (`onUpdate`, `onChange`); hàm xử lý bên trong đặt tên `handleXxx` (`handleUpdate`).
- Danh sách render bằng `.map()` phải có `key` ổn định (id, code), **không dùng index**.

```jsx
// pages/ – holds state and calls API
<GameTable games={games} vendors={vendors} loading={loading} onUpdate={handleUpdate} />

// components/ – just renders props and reports events up
export default function GameTable({ games, vendors, loading, onUpdate }) { ... }
```

**Gọi API**

- Mọi request đi qua `src/api/client.js`. Không gọi `fetch` trực tiếp trong component.
- Logic tải dữ liệu có state (loading, error, reload) đặt trong custom hook, ví dụ `useGames`.
- Luôn xử lý đủ 3 trạng thái: đang tải, lỗi (hiển thị bằng `<Notice>`), không có dữ liệu.
- Request có thể bị thay bởi request mới (filter, search) thì hủy request cũ bằng `AbortController`.
- Ô tìm kiếm gõ liên tục thì dùng `useDebounce`, không gọi API mỗi lần gõ phím.

**State và hook**

- Không lưu state có thể tính ra từ state/props khác. Tính trực tiếp khi render, hoặc dùng `useMemo` nếu tốn công.
- Cập nhật state dựa trên giá trị cũ thì dùng dạng hàm: `setForm((current) => ({ ...current, title }))`.
- Không sửa trực tiếp state (mutate) như `games.push(...)`; luôn tạo mảng/object mới.
- `useEffect` chỉ dùng để đồng bộ với bên ngoài (API, timer, event). Khai báo đủ dependency và trả về hàm dọn dẹp (`clearTimeout`, `abort`) khi cần.
- Object/hàm truyền vào dependency của hook khác thì bọc `useMemo` / `useCallback` để không bị chạy lại vô hạn (xem `filters` trong `GamesPage.jsx`).

**Style**

- CSS viết trong `src/styles.css`, class đặt tên kebab-case (`page-header`, `nav-item`), trạng thái dùng tiền tố `is-` (`is-active`, `is-loading`).
- Màu dùng biến CSS trong `:root` (`var(--primary)`), không ghi cứng mã màu ở nhiều nơi.
- Hạn chế inline `style={{ ... }}`.
- Kiểm tra giao diện ở cả màn hình rộng và hẹp (≤ 720px).

### Git và checklist trước khi nhờ review

- Mỗi task một branch: `feature/<mô-tả-ngắn>` hoặc `fix/<mô-tả-ngắn>`. Không commit thẳng lên `main`.
- Commit message tiếng Anh, ngắn, bắt đầu bằng động từ: `Add game type filter`, `Fix double fetch on filter change`.
- Trước khi báo xong:
  - [ ] `cd server && npm test` pass
  - [ ] `cd client && npm run build` không lỗi
  - [ ] `npm run format:check` pass ở cả `server/` và `client/`
  - [ ] Tự test lại trên trình duyệt, kể cả trường hợp lỗi
  - [ ] Không còn `console.log` debug, code comment-out
  - [ ] Cập nhật `.env.example`, `schema.sql`, README nếu có thay đổi liên quan

## Bài tập cho intern

Làm theo thứ tự. Mỗi bài: đọc code liên quan → tự làm → viết/chạy test → nhờ mentor review.

### Cấp 1 – Làm quen

1. Chạy được cả server và client. Dùng Postman/curl gọi thử tất cả API trong bảng trên.
2. Đọc `server/src/app.js` và vẽ lại luồng của `GET /api/games` qua từng file.
3. Thêm 3 game mới vào `data/seed.js` cho một vendor mới `hacksaw` (Hacksaw Gaming). Kiểm tra test nào bị ảnh hưởng và sửa cho đúng.
4. Hiển thị cột `createdAt` trong bảng, định dạng `YYYY-MM-DD`.

### Cấp 2 – Tính năng nhỏ

5. Thêm filter theo `type` (SLOT/LIVE/TABLE) ở cả API và giao diện. Viết test cho API.
6. Cho phép bấm vào tiêu đề cột Title/Sort để sắp xếp tăng/giảm (API đã hỗ trợ `sortBy`, `order`).
7. Thêm API `GET /api/games/stats` trả về số game theo vendor và số game đang bật. Hiển thị trên đầu trang.
8. Khi đổi filter, app đang gọi API 2 lần (một lần với trang cũ, một lần với trang 1). Tìm nguyên nhân trong `GamesPage.jsx` và sửa để chỉ gọi 1 lần.

### Cấp 3 – Nâng cao

9. Thêm `DELETE /api/games/:id` nhưng **không xóa thật**: chỉ đánh dấu `deletedAt` và ẩn khỏi danh sách (soft delete). Thêm nút xóa có hỏi xác nhận.
10. Bulk update: chọn nhiều game bằng checkbox rồi bật/tắt cùng lúc (`PATCH /api/games/bulk`).
11. Lưu filter vào URL (`?vendor=...&page=2`) để reload trang hoặc gửi link vẫn giữ nguyên filter.
