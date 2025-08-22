"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import MedicinePage from "./medicine/page";
import Dashboard from "./dashboard/page";
import Link from "next/link";

export default function Home() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Welcome to the Medicine OCR Assistant
      </h1>

      <SignedIn>
        {/* You can customize this layout */}
        <Dashboard />
        <div className="mt-10">
          <MedicinePage />
        </div>
      </SignedIn>

      <SignedOut>
        <div className="text-center">
          <p>Please log in to access your dashboard and medicine services.</p>
          <Link
            href="/auth/login"
            className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Login
          </Link>
        </div>
      </SignedOut>
    </div>
  );
}
