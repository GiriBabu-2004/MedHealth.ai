  "use client";
  import React from "react";
  import { SignIn } from "@clerk/nextjs";

  const LoginPage = () => {
    return (
      <div className="flex justify-center items-center h-screen">
        <SignIn
  path="/sign-in"
  routing="path"
  forceRedirectUrl="/dashboard"
  fallbackRedirectUrl="/dashboard"
/>


      </div>
    );
  };

  export default LoginPage;
