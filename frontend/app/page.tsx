"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>("Checking...");

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${apiUrl}/health`)
      .then((res) => res.json())
      .then((data) => setApiStatus(data.status))
      .catch(() => setApiStatus("Error"));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center justify-center gap-8 p-8">
        <h1 className="text-4xl font-bold text-black dark:text-white">
          Kemureco
        </h1>
        <div className="text-center">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            API Status: <span className="font-semibold">{apiStatus}</span>
          </p>
        </div>
      </main>
    </div>
  );
}
