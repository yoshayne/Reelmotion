import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { apiFetch } from "@/react-app/utils/api";

export function useAdminRole() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) {
      setIsChecking(false);
      return;
    }
    apiFetch("/api/users/me")
      .then((r) => r.json() as Promise<{ role: string }>)
      .then((data) => {
        setIsAdmin(data.role === "admin");
        setIsCreator(data.role === "admin" || data.role === "creator");
      })
      .catch(() => {
        // ignore
      })
      .finally(() => setIsChecking(false));
  }, [user, isLoaded]);

  return { isAdmin, isCreator, isChecking };
}
