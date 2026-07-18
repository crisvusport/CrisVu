# CRIS VŨ — Website catalog áo bóng đá replica

Bản này gồm phần KHÁCH NHÌN THẤY (đã hoàn thiện):
- `index.html` — Trang chủ
- `catalog.html` — Sản phẩm (tìm kiếm + 6 bộ lọc)
- `about.html` — Giới thiệu shop
- `data/products.json` — Danh sách sản phẩm
- `images/` — Nơi để ảnh thật (đặt tên: `{id}-front.jpg`, `{id}-back.jpg`, `{id}-detail.jpg`)
- `assets/` — Giao diện & mã nguồn (không cần đụng vào)

## Đưa web lên mạng (GitHub Pages) — làm 1 lần

1. Tạo 1 repository mới trên GitHub, chọn **Public**.
2. Upload toàn bộ file/thư mục **bên trong** thư mục `cris-vu` lên repo (kéo-thả trên GitHub).
3. Vào **Settings → Pages → Source: Deploy from a branch → Branch: main → /(root) → Save**.
4. Đợi 1–2 phút, GitHub cho link dạng: `https://<tên-github>.github.io/<tên-repo>/`

## Xem thử ngay trên máy (không cần internet)

Mở thư mục này bằng terminal rồi chạy:

    python3 -m http.server 8000

Sau đó mở trình duyệt vào `http://localhost:8000`

## Chuyển ngôn ngữ

Nút **EN / VI** ở góc trên bên phải. Ngôn ngữ lưu trong đường link (`?lang=en`) nên gửi link tiếng Anh cho khách nước ngoài được luôn.

## Sắp tới
Trang quản trị (admin) để tự thêm/sửa sản phẩm + ảnh (không cần code) sẽ được bổ sung ở bước tiếp theo.
