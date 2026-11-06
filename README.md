# BCH TRỰC CỔNG – Web App

Ứng dụng ghi nhận vi phạm nề nếp học sinh, dùng Firebase Authentication và Cloud Firestore.

## Chức năng đã có
- Đăng nhập bằng tài khoản Firebase Authentication.
- Dashboard thống kê tổng lượt vi phạm và từng nhóm lỗi.
- Ghi nhận một hoặc nhiều học sinh cùng lỗi: đi học muộn, vi phạm đồng phục, không đội mũ bảo hiểm.
- Lưu BCH/người trực, tuần, ngày, học sinh, lớp, lỗi, ghi chú và tài khoản ghi nhận.
- Sổ vi phạm có bộ lọc ngày, lỗi, lớp.
- Quản lý danh sách học sinh: thêm thủ công, nhập CSV.
- Xuất sổ vi phạm ra CSV (mở được bằng Excel).
- Giao diện responsive cho điện thoại và máy tính.

## A. Tạo Firebase
1. Truy cập https://console.firebase.google.com/ và tạo project, ví dụ `bch-truc-cong`.
2. Chọn Add app > Web (</>) và đăng ký ứng dụng.
3. Sao chép Firebase config. Đổi `firebase-config.js.example` thành `firebase-config.js`, điền cấu hình thật.
4. Vào Authentication > Get started > Sign-in method, bật Email/Password.
5. Vào Authentication > Users > Add user, tạo tài khoản cho quản trị viên và thành viên BCH.
6. Vào Firestore Database > Create database.
7. Mở tab Rules, dán nội dung file `firestore.rules` rồi Publish.

## B. Cấp quyền quản trị
Sau khi tạo tài khoản quản trị, mở Firestore > Data và tạo collection `users`.
Tạo document có Document ID đúng bằng **UID** của tài khoản quản trị (lấy tại Authentication > Users).
Thêm field:
- `role` (string): `admin`

Tài khoản khác không có hồ sơ role sẽ được xem là `member`.
Theo rules hiện tại, chỉ admin được thêm danh sách học sinh; thành viên BCH được ghi nhận vi phạm và xem dữ liệu.

## C. Chạy thử
Vì app dùng JavaScript modules, không mở trực tiếp bằng `file://`.
Có thể dùng VS Code + extension Live Server, hoặc chạy:
```bash
python -m http.server 5500
```
Mở `http://localhost:5500`.

## D. Đưa lên GitHub Pages
1. Tạo repository GitHub, tải các file trong thư mục này lên.
2. Đảm bảo file cấu hình đã được tạo với tên `firebase-config.js`.
3. Vào Settings > Pages > Deploy from a branch > chọn `main` và `/root`.
4. Truy cập địa chỉ GitHub Pages được cấp.

## E. Cấu trúc dữ liệu Firestore
- `users/{uid}`: role = admin hoặc member.
- `students/{studentId}`: name, className, code, createdAt.
- `violations/{violationId}`: team, week, date, type, studentId, studentName, className, studentCode, note, createdBy, createdByEmail, createdAt.

## Lưu ý trước khi dùng thật
- Firebase config trong `firebase-config.js` là cấu hình định danh ứng dụng web, không phải mật khẩu quản trị. Tuy nhiên cần giữ Firestore Rules đúng và không mở quyền ghi/xóa công khai.
- Rules mẫu này phù hợp bản khởi đầu. Trước khi vận hành toàn trường nên bổ sung quy trình duyệt, nhật ký chỉnh sửa, chống ghi trùng và chính sách sao lưu.
- Bộ lớp mặc định đang khai báo 28 lớp minh họa theo dạng 10A1–10A12, 11A1–11A8, 12A1–12A8. Hãy sửa mảng `CLASSES` trong `app.js` đúng tên lớp thực tế của trường.
- CSV nhập học sinh dùng 3 cột: `HoTen,Lop,MaHocSinh`. Bản nhập CSV đơn giản phân tách bằng dấu phẩy; với tên có dấu phẩy hoặc CSV phức tạp, hãy chuẩn hóa file trước khi nhập.
- Chưa có cấu hình Firebase thật nên ứng dụng chưa thể đăng nhập/lưu dữ liệu cho đến khi hoàn thành phần A và B.
