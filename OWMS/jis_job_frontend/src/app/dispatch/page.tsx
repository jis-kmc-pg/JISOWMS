"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DispatchPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/reservation?tab=vehicle");
    }, [router]);

    return null;
}
