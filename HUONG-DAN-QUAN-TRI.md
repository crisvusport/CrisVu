# Hướng dẫn dùng Trang quản trị CRIS VŨ

Địa chỉ trang quản trị:  https://crisvusport.github.io/CrisVu/admin.html
(Nên lưu (bookmark) lại, KHÔNG chia sẻ link kèm token cho ai.)

## Lần đầu: tạo token GitHub (làm 1 lần, miễn phí)
1. github.com → ảnh đại diện góc phải → Settings
2. Cuối menu trái → Developer settings
3. Personal access tokens → Fine-grained tokens → Generate new token
4. Đặt tên bất kỳ (VD: cris-vu-admin). Expiration chọn thời hạn tùy ý.
5. Repository access → Only select repositories → chọn repo CrisVu
6. Permissions → Repository permissions → Contents → Read and write
7. Generate token → sao chép mã (dạng github_pat_...) và lưu lại nơi an toàn.

## Dùng hằng ngày
1. Mở admin.html, dán token, bấm Đăng nhập.
2. Thêm sản phẩm: bấm "+ Thêm sản phẩm", điền thông tin, chọn ảnh, bấm Lưu.
3. Sửa: bấm "Sửa" ở sản phẩm cần đổi. Để trống ô ảnh nào thì giữ ảnh cũ ô đó.
4. Xoá: bấm "Xoá" (có xác nhận). Ảnh của sản phẩm cũng được xoá.
5. Sau khi lưu, web công khai cập nhật sau khoảng 1 phút.

Lưu ý: token chỉ giữ trong phiên (đóng tab là mất) cho an toàn. Đổi máy thì dán lại token.
Nếu lỡ lộ token: vào lại trang token trên GitHub, bấm Revoke để huỷ, rồi tạo token mới.
