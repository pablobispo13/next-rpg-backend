// pages/page.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (user) router.push("/protected/mesa");
        else router.push("/login");
    }, [user, router]);

    return null;
}
