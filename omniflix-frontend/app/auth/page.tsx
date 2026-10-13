import { redirect } from "next/navigation";

export default function AuthIndexRedirect() {
    // Redirect /auth to /auth/signin by default
    redirect("/auth/signin");
}
