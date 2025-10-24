"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash } from "@fortawesome/free-solid-svg-icons/faEyeSlash";
import { faEye } from "@fortawesome/free-solid-svg-icons";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace("#", ""));
    const access_token = hashParams.get("code");

    if (access_token) {
      supabase.auth.setSession({ access_token, refresh_token: "" });
      setMessage("Access granted. Enter your new password below.");
    } else {
      setMessage("⚠️ Invalid or expired reset link.");
    }
  }, []);

  const handleUpdate = async () => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setMessage(error.message);
    else {
      setMessage("✅ Password updated successfully!");
      setTimeout(() => router.push("/Login"), 1200);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-console-bgl font-mono">
      <div className="w-lvw max-w-lg bg-main-content-tabl backdrop-blur-xs rounded-2xl shadow-[inset_0_4px_5px_rgba(0,0,0,0.3)] p-9 flex flex-col items-center text-center">
        <div className="w-[90vw] max-w-md bg-main-content-tabl backdrop-blur-xs rounded-2xl shadow-[0_0px_20px_rgba(0,0,0,0.4)] p-9 flex flex-col items-center text-center">
          <img src="/logoDark.svg" alt="PortXNect Logo" className="max-h-12 mb-5" />
          <p className="text-console-textl text-sm mb-6">
            {message || "Reset your password below."}
          </p>

          {/* Password Input with Toggle */}
          <div className="relative w-full mb-4">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full rounded-3xl bg-[#b3b3b361] text-console-inputl placeholder:text-console-textl shadow-[inset_0_4px_10px_rgba(0,0,0,0.25)] px-4 py-2 outline-none focus:ring-2 focus:ring-brand pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-2 text-console-textl cursor-pointer hover:text-brand transition-colors"
            >
              {showPassword ? <FontAwesomeIcon icon={faEyeSlash}  /> : <FontAwesomeIcon icon={faEye} />}
            </button>
          </div>

          <button
            onClick={handleUpdate}
            className="w-full bg-brand text-white py-2 rounded-3xl font-semibold cursor-pointer shadow-[inset_0_4px_10px_rgba(0,0,0,0),0_4px_10px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_4px_10px_rgba(0,0,0,0.3),0_4px_10px_rgba(0,0,0,0.6)] transition-all"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}
