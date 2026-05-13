Đây là cách viết đường dẫn khi import nhanh hơn cho ae
"paths": {
      "@/*": ["src/*"],
      "@@/*": ["src/.umi/*"],
      "@admin/*": ["src/roles/admin/*"],
      "@gv/*": ["src/roles/lecturer/*"],
      "@sv/*": ["src/roles/student/*"],
      "@types/*": ["src/types/*"]
    }
  

Tôi đã tạo cấu trúc với 3 role là admin,lecturer và student
ae làm phần nào vô đúng 3 role đó 
pages:
    404: là trang báo "not found" 
    Admin , Lecturer , Student : làm pages admin , lecturer , student
    Login : Trang đăng nhập
    Register : Trang này tôi cũng không biết còn dùng không , phần này thuộc ae nào làm thì hãy kiểm tra , có thể xóa nếu không cần thiết 
    Dashboard : Đây là trang điều hướng cho dashboard khi người dùng đăng nhập , nó sẽ dựa trên role của user để điều hướng đến đúng dashboard của role đó 
services : 
    -"Service là nơi duy nhất chứa các hàm gọi API (CRUD); UI chỉ việc gọi tên hàm để lấy dữ liệu chứ tuyệt đối không được viết URL hay xử lý logic kết nối bên trong."
    - "Service là 'kho dùng chung' cho mọi chức năng: Thay vì mỗi Role (Sinh viên, Giảng viên, Admin) tự viết code gọi API riêng, tất cả đều qua đây lấy đúng một 'nguồn' duy nhất để không bao giờ bị lệch dữ liệu hay thừa code."
    - Ví dụ cho ae dễ hiểu : src/services/thesis.ts trong file này có func getThesisList() (tức là lấy danh sách đề tài) thì cả 3 role đều phải gọi là lấy func ở file này tránh trường hợp code trùng lặp 
types : file này chắc ae tự hiểu nhé 
