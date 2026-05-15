import { User } from "@/types/AuthTypes/Users";

export default function access(
  initialState: { currentUser?: User } | undefined,
) {
  const { currentUser } = initialState ?? {};

  return {
 
    isAdmin: currentUser?.role === "admin",
    canSeeThesis:
      currentUser?.role === "student" || currentUser?.role === "lecturer",
    isStudent: currentUser?.role === "student",
    isLecturer: currentUser?.role === "lecturer",
  };
}
