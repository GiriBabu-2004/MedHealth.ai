"use client";

import { useUser, useAuth, SignOutButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [response, setResponse] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Sync user data to backend on mount or when user changes
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const syncUser = async () => {
      setSyncing(true);
     try {
  const token = await getToken();
  console.log("Sending token:", token);

  const res = await fetch("http://localhost:4000/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: user.fullName,
      email: user.primaryEmailAddress?.emailAddress,
    }),
  });

  console.log("Sync response status:", res.status);

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Sync error text:", errorText);
    throw new Error("Failed to sync user");
  }

  const data = await res.json();
  console.log("User synced:", data);
} catch (err) {
  console.error("Sync user error:", err);
}

      setSyncing(false);
    };

    syncUser();
  }, [isLoaded, isSignedIn, user, getToken]);

  const fetchData = async () => {
    if (!isLoaded || !isSignedIn) {
      alert("Please sign in first");
      return;
    }

    const token = await getToken();

    const res = await fetch("http://localhost:4000/api/protected", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      alert("Failed to fetch protected data");
      return;
    }

    const data = await res.json();
    setResponse(data);
    console.log("Backend says:", data);
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Please sign in to access the dashboard.</div>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <SignOutButton>
          <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Sign Out
          </button>
        </SignOutButton>
      </div>

      {syncing && <p className="text-sm text-gray-500 mb-4">Syncing user data...</p>}

      <button
        onClick={fetchData}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Fetch Protected Data
      </button>

      {response && (
        <pre className="mt-6 bg-gray-100 p-4 rounded whitespace-pre-wrap">
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
}
