import { User } from "@/types/AuthTypes/Users";

export default function access(
  initialState: { currentUser?: User } | undefined,
) {
  const { currentUser } = initialState ?? {};

  // 🔥 ÉP KIỂU CHUẨN HÓA: Ép về chữ thường để tránh lỗi Backend trả về "ADMIN", "STUDENT" gây lệch logic hiển thị
  const userRole = currentUser?.role?.toLowerCase();

  return {
    isAdmin: userRole === "admin",

    isLecturer: userRole === "lecturer",

    isStudent: userRole === "student",

    canSeeThesis: userRole === "student" || userRole === "lecturer",

    isAuthorized:
      !!userRole && ["admin", "lecturer", "student"].includes(userRole),
  };
}
