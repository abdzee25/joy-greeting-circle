import { useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";

export function PasswordGate({
  expected,
  title,
  children,
}: {
  expected: string;
  title: string;
  children: React.ReactNode;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [pwd, setPwd] = useState("");

  if (unlocked) return <>{children}</>;

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Enter the password to continue.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pwd === expected) {
              setUnlocked(true);
              toast.success("Access granted");
            } else {
              toast.error("Incorrect password");
            }
          }}
          className="mt-6 space-y-3"
        >
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            autoFocus
          />
          <button className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-transform hover:scale-[1.01]">
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}