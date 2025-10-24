"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import {
  signInWithGithub,
  signInWithGoogle,
  signupWithEmailPassword,
  signInWithEmailPassword,
  resetPassword,
} from "@/app/utils/action";
import { useRouter, useSearchParams } from "next/navigation";
import { faChevronRight, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faGoogle } from "@fortawesome/free-brands-svg-icons";
import { useTheme } from "@/app/hooks/useTheme";

type LineType = "in" | "out" | "ok" | "err";

interface ConsoleLine {
  text: string;
  type: LineType;
}

interface AuthResponse {
  success: string | null;
  redirectUrl?: string;
  error: string | null;
}

type ActionFunction = (state: AuthResponse, formData: FormData) => Promise<AuthResponse>;

const ConsoleTerminal: React.FC = () => {
  const [lines, setLines] = useState<ConsoleLine[]>([
    { text: "PORTXNECT Console — version: dev", type: "ok" },
    { text: 'Type "help" for a list of commands.\n', type: "out" },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIndex, setHistIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const accessToken = searchParams.get("code");

  // this is used for changing theme
  const [theme, toggleTheme] = useTheme();

  const router = useRouter();

  // Hover Functionalities

  const lastModeRef = useRef<"login" | "signup" | null>(null);

  const authRouter: ActionFunction = async (s, formData) => {
    const mode = (formData.get("mode") as string) ?? "login";
    if (mode === "signup") {
      return await signupWithEmailPassword(s, formData);
    }
    return await signInWithEmailPassword(s, formData);
  };

  useEffect(() => {
    if (accessToken) {
      // set password automatically or allow user to type
      appendLine("Password reset token detected. Type 'login <email> <new-password>' to reset.", "ok");
      // Optionally, you can pre-fill email if you pass it in the URL
    }
  }, [accessToken]);

  const [state, formAction, isPending] = useActionState<AuthResponse, FormData>(
    authRouter,
    { success: null, error: null }
  );

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    if (isPending) {
      const interval = setInterval(() => {
        setLines((prev) => {
          const lastLine = prev[prev.length - 1];
          if (
            lastLine.text.startsWith("Authenticating") ||
            lastLine.text.startsWith("Creating account")
          ) {
            const dots = (lastLine.text.match(/\./g) || []).length;
            const newText =
              dots < 3
                ? `${lastLine.text.split(".")[0]}${".".repeat(dots + 1)}`
                : `${lastLine.text.split(".")[0]}.`;
            return [...prev.slice(0, -1), { text: newText, type: "out" }];
          }
          return prev;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isPending]);

  useEffect(() => {
    if (state.success) {
      appendLine(state.success, "ok");
      if (lastModeRef.current === "login") {
        startTransition(() => {
          router.push("/dashboard");
        });
      }
      lastModeRef.current = null;
    }
    if (state.error) {
      appendLine(state.error, "err");
      lastModeRef.current = null;
    }
  }, [state.success, state.error, router]);

  const appendLine = (text: string, type: LineType = "out") => {
    setLines((prev) => [...prev, { text, type }]);
  };

  const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isStrongPassword = (password: string): boolean => password.length >= 8;

  const runCommand = async (cmd: string) => {
    const parts = cmd.trim().split(/\s+/).filter(Boolean);
    const cmdName = parts[0]?.toLowerCase() ?? "";
    const args = parts.slice(1);

    if (!cmdName) {
      appendLine("No command entered.", "err");
      return;
    }

    switch (cmdName) {
      case "help":
        appendLine(
          `Available commands:
help - show this list
login <email> <password> - login user
signup <email> <password> - create account
reset <email> - send password reset
auth google/github - authenticate with OAuth
theme - toggle theme
clear - clear console`,
          "out"
        );
        break;

      case "clear":
        setLines([
          { text: "PORTXNECT Console — version: dev", type: "ok" },
          { text: 'Type "help" for a list of commands.\n', type: "out" },
        ]);
        break;

      case "theme":
        if (isPending) {
          appendLine("Cannot toggle theme while action pending.", "err");
          break;
        }
        appendLine("Theme toggled.", "ok");
        break;

      case "login": {
        if (args.length < 2) {
          appendLine("Usage: login <email> <password>", "err");
          break;
        }
        const [email, password] = args;
        if (!isValidEmail(email)) {
          appendLine("Invalid email format.", "err");
          break;
        }
        if (password.length < 6) {
          appendLine("Password must be at least 6 characters.", "err");
          break;
        }

        appendLine(`Email: ${email}`, "out");
        appendLine(`Password: ${"*".repeat(password.length)}`, "out");
        appendLine("Authenticating.", "out");

        const fd = new FormData();
        fd.append("email", email);
        fd.append("password", password);
        fd.append("mode", "login");

        lastModeRef.current = "login";
        startTransition(() => void formAction(fd));
        break;
      }

      case "signup": {
        if (args.length < 2) {
          appendLine("Usage: signup <email> <password>", "err");
          break;
        }
        const [email, password] = args;
        if (!isValidEmail(email)) {
          appendLine("Invalid email format.", "err");
          break;
        }
        if (!isStrongPassword(password)) {
          appendLine("Password must be at least 8 characters.", "err");
          break;
        }

        appendLine(`Email: ${email}`, "out");
        appendLine(`Password: ${"*".repeat(password.length)}`, "out");
        appendLine("Creating account.", "out");

        const fd = new FormData();
        fd.append("email", email);
        fd.append("password", password);
        fd.append("mode", "signup");

        lastModeRef.current = "signup";
        startTransition(() => void formAction(fd));
        break;
      }

      case "reset": {
        if (args.length < 1) {
          appendLine("Usage: reset <email>", "err");
          break;
        }
        const email = args[0];
        if (!isValidEmail(email)) {
          appendLine("Invalid email format.", "err");
          break;
        }
        appendLine(`Sending reset link to ${email}...`, "out");

        const fd = new FormData();
        fd.append("email", email);

        try {
          const result = await resetPassword({ success: null, error: null }, fd);
          if (result.success) appendLine(result.success, "ok");
          if (result.error) appendLine(result.error, "err");
        } catch {
          appendLine("Unexpected error during reset.", "err");
        }
        break;
      }

      case "auth": {
        const provider = args[0]?.toLowerCase();
        if (provider === "google") {
          appendLine("Redirecting to Google OAuth...", "out");
          const fd = new FormData();
          try {
            const result = await signInWithGoogle({ success: null, error: null }, fd);
            if (result.success) appendLine(result.success, "ok");
            if (result.error) appendLine(result.error, "err");
          } catch {
            appendLine("OAuth error.", "err");
          }
        } else if (provider === "github") {
          appendLine("Redirecting to GitHub OAuth...", "out");
          const fd = new FormData();
          try {
            const result = await signInWithGithub({ success: null, error: null }, fd);
            if (result.success) appendLine(result.success, "ok");
            if (result.error) appendLine(result.error, "err");
          } catch {
            appendLine("OAuth error.", "err");
          }
        } else {
          appendLine("Usage: auth google | github", "err");
        }
        break;
      }

      default:
        appendLine(`Unknown command: ${cmdName}`, "err");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    // Split input to check if it's a login/signup command
    const [cmd, ...args] = input.trim().split(/\s+/);

    // Hide sensitive inputs
    if (cmd === "login" && args.length >= 2) {
      appendLine("portx:$ login ******** ********", "ok");
    } else if (cmd === "signup" && args.length >= 2) {
      appendLine("portx:$ signup ******** ********", "ok");
    } else {
      appendLine(`portx:$ ${input}`, "ok");
    }

    const current = input;
    setInput(""); // clear visible input
    await runCommand(current);
    setHistory((prev) => [current, ...prev]);
    setHistIndex(-1);
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isPending) {
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHistIndex((prev) => {
        const newIndex = Math.min(prev + 1, history.length - 1);
        setInput(history[newIndex] || "");
        return newIndex;
      });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHistIndex((prev) => {
        const newIndex = Math.max(prev - 1, -1);
        setInput(newIndex === -1 ? "" : history[newIndex]);
        return newIndex;
      });
    }
  };

  useEffect(() => {
    const buttons = document.querySelectorAll("[data-cmd]");
    buttons.forEach((btn) => {
      const onClick = () => {
        const cmd = btn.getAttribute("data-cmd");
        if (!cmd || isPending) return;
        if (["help", "clear", "theme"].includes(cmd)) {
          appendLine(`portx:$ ${cmd}`, `${cmd === 'help' ? 'ok' : 'in'}`);
          runCommand(cmd);
        } else {
          setInput(cmd + " ");
        }
      };
      btn.addEventListener("click", onClick);
    });

    return () => {
      const buttons = document.querySelectorAll("[data-cmd]");
      buttons.forEach((btn) => btn.replaceWith(btn.cloneNode(true)));
    };
  }, [lines, isPending, history]);


  // Sign In with Google
  const GoogleLogin = async (e: any) => {
    e.preventDefault();
    if (isPending) return;
    appendLine("Redirecting to Google OAuth...", "out");
    try {
      const fd = new FormData();
      const result = await signInWithGoogle({ success: null, error: null }, fd);
      if (result?.redirectUrl) {
        window.location.href = result?.redirectUrl; // perform client redirect
      }
      if (result.success) appendLine(result.success, "ok");
      if (result.error) appendLine(result.error, "err");
    } catch {
      appendLine("OAuth error.", "err");
    }
  }
  // Sign In with GitHub
  const gitHubLogin = async (e: any) => {
    e.preventDefault();
    if (isPending) return;
    appendLine("Redirecting to GitHub OAuth...", "out");
    try {
      const fd = new FormData();
      const result = await signInWithGithub({ success: null, error: null }, fd);
      if (result?.redirectUrl) {
        window.location.href = result?.redirectUrl; // perform client redirect
      }
      if (result.success) appendLine(result.success, "ok");
      if (result.error) appendLine(result.error, "err");
    } catch {
      appendLine("OAuth error.", "err");
    }
  }


  return (
    <div className="lg:w-[90vw] lg:flex-row flex-col font-medium flex gap-5 p-6 shadow-[inset_0_4px_10px_rgba(0,0,0,0.25)] rounded-2xl overflow-hidden dark:bg-main-content-bgl-dark bg-main-content-bgl">
      {/* Left Console */}
      <div className="lg:w-[55%] select-none flex flex-col p-8 rounded-2xl backdrop-blur-xs shadow-[0_4px_10px_rgba(0,0,0,0.5)] dark:bg-main-content-tabl-dark bg-main-content-tabl-light">
        <header className="max-h-[8vh] flex items-center">
          <img
            src={theme === "dark" ? "/logoLight.png" : "/logoDark.svg"}
            alt="logo"
            className="max-h-12 transition-all duration-300"
          />        </header>

        <div className="rounded-lg w-full font-mono mx-auto mt-5 flex-1 flex flex-col">
          <div ref={containerRef} className="lg:h-[55vh] h-[50vh] overflow-y-auto font-mono text-sm mb-2 whitespace-pre-wrap">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className={`text-md my-1 font-medium
              ${line.type === "err"
                    ? "text-console-errorl dark:text-console-errorl-dark"
                    : line.type === "ok"
                      ? "text-brand-light dark:text-brand-dark"
                      : "text-console-textl-light dark:text-console-textl-dark"
                  }`}
              >
                {line.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex space-x-5 items-center">
            <span className="mr-1 dark:text-console-mute-dark">portx:$</span>
            <div className="rounded-4xl px-1.5 py-1 flex items-center flex-1 shadow-[inset_0_4px_10px_rgba(0,0,0,0.25)] bg-[#b3b3b361] dark:bg-input-bgl-dark text-console-inputl-light dark:text-console-inputl-dark">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(isPending ? "" : e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full outline-none px-2 text-console-textl-light dark:text-console-textl-dark bg-transparent"
                placeholder="Enter query here..."
                autoFocus
                disabled={isPending}
              />
              <button
                type="submit"
                className="py-1 px-1.5 rounded-3xl hover:shadow-[inset_0_4px_10px_rgba(0,0,0,0.15),0_4px_10px_rgba(0,0,0,0.5)] cursor-pointer bg-[#808080] disabled:opacity-50"
                disabled={isPending}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="lg:w-[45%] flex flex-col justify-between p-4 lg:p-8 rounded-2xl backdrop-blur-xs shadow-[0_4px_10px_rgba(0,0,0,0.5)] dark:bg-main-content-tabl-dark bg-main-content-tabl-light">
        <div className="flex flex-col gap-4">
          <header className="max-h-[10vh] font-mono flex justify-between items-center text-console-textl-light dark:text-console-textl-dark">
            <h3 className="text-xl font-semibold">Authentication</h3>
            <button
              onClick={() => { if (!isPending) toggleTheme(); appendLine("Theme toggled.", "ok"); }}
              className="cursor-pointer rounded-full py-2 px-2.5 shadow-[0_0px_10px_rgba(0,0,0,0.25)] hover:shadow-[inset_0_4px_10px_rgba(0,0,0,0.15),0_4px_10px_rgba(0,0,0,0.5)] hover:bg-input-bgl dark:hover:bg-input-bgl-dark hover:text-console-inputl"
            >
              {theme === "light" ? <FontAwesomeIcon icon={faSun} /> : <FontAwesomeIcon icon={faMoon} />}
            </button>
          </header>

          <p className="text-console-mute-light dark:text-console-mute-dark text-sm">
            Type commands directly. Press Enter to execute. Use ↑/↓ for history and Tab for completion.
          </p>

          <h5 className="text-sm font-sans text-console-mute-light dark:text-console-mute-dark">Quick Commands</h5>
          <div className="grid lg:grid-cols-3 gap-5 font-mono">
            {["help", "login", "signup", "clear", "reset"].map((cmd) => (
              <button
                key={cmd}
                data-cmd={cmd}
                className="py-2 w-full text-sm lg:text-base rounded-3xl shadow-[inset_0_4px_10px_rgba(0,0,0,0.15),0_4px_10px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_4px_10px_rgba(0,0,0,0.15),0_4px_10px_rgba(0,0,0,0.5)] text-md bg-dark-border-muted dark:bg-dark-border-muted-dark cursor-pointer dark:text-console-textl-dark disabled:opacity-50"
                disabled={isPending}
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col mt-4 font-sans">
          <h3 className="text-dark-text-muted text-sm mb-2 text-console-mute-light dark:text-console-mute-dark">Social</h3>
          <div className="grid lg:grid-cols-2 text-sm font-sans lg:text-base gap-4">
            <button
              type="submit"
              className="w-full py-2 gap-2 flex items-center justify-center rounded-3xl shadow-[inset_0_4px_10px_rgba(0,0,0,0.15),0_4px_10px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_4px_10px_rgba(0,0,0,0.15),0_4px_10px_rgba(0,0,0,0.5)] text-md bg-dark-border-muted dark:bg-dark-border-muted-dark dark:text-console-inputl-dark cursor-pointer disabled:opacity-50"
              disabled={isPending}
              onClick={GoogleLogin}
            >
              <FontAwesomeIcon icon={faGoogle} /> Sign In with Google
            </button>

            <button
              type="submit"
              className="w-full py-2 gap-2 flex items-center justify-center rounded-3xl shadow-[inset_0_4px_10px_rgba(0,0,0,0.15),0_4px_10px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_4px_10px_rgba(0,0,0,0.15),0_4px_10px_rgba(0,0,0,0.5)] text-md bg-dark-border-muted dark:bg-dark-border-muted-dark dark:text-console-inputl-dark cursor-pointer disabled:opacity-50"
              disabled={isPending}
              onClick={gitHubLogin}
            >
              <FontAwesomeIcon icon={faGithub} /> Sign In With GitHub
            </button>
          </div>
        </div>
      </div>
    </div>

  );
}
export default ConsoleTerminal;