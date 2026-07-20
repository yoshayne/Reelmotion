import { SignInButton } from "@clerk/clerk-react";
import { useEffectiveAuth } from "@/react-app/hooks/useEffectiveAuth";
import { useState, useRef, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { apiFetch } from "@/react-app/utils/api";

export default function ActivateTVPage() {
  const { isLoaded, isSignedIn } = useEffectiveAuth();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      inputRef.current?.focus();
    }
  }, [isLoaded, isSignedIn]);

  async function handleActivate(codeValue: string) {
    if (codeValue.length !== 6 || status === "loading") return;
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await apiFetch("/api/auth/device/activate", {
        method: "POST",
        body: JSON.stringify({ code: codeValue }),
      });
      const data = await res.json() as { error?: string; message?: string };

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please check your connection and try again.");
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setCode(value);
    if (value.length === 6) {
      void handleActivate(value);
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-white text-2xl font-bold mb-3">Activate Your TV</h1>
          <p className="text-gray-400 mb-6">
            You need to be signed in to activate a TV device.
          </p>
          <SignInButton mode="modal">
            <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold mb-3">TV Activated!</h1>
          <p className="text-green-400 text-lg">
            Your TV has been successfully linked! You can now return to your TV.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center w-full max-w-sm">
        <h1 className="text-white text-3xl font-bold mb-2">Activate Your TV</h1>
        <p className="text-gray-400 mb-8">
          Enter the 6-character code shown on your TV screen
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleActivate(code);
          }}
          className="space-y-4"
        >
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="X7K2PQ"
            maxLength={6}
            value={code}
            onChange={handleChange}
            disabled={status === "loading"}
            className="w-full bg-gray-900 border-2 border-gray-700 focus:border-red-600 outline-none text-white text-3xl text-center tracking-widest font-mono py-4 px-6 rounded-lg transition-colors disabled:opacity-50"
          />

          {status === "error" && (
            <p className="text-red-400 text-sm">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={code.length !== 6 || status === "loading"}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg"
          >
            {status === "loading" ? "Activating…" : "Activate TV"}
          </button>
        </form>
      </div>
    </div>
  );
}
