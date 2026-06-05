import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { apiFetch } from "@/react-app/utils/api";

export function useAdminRole() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      // Reset on logout so a non-admin who logs in after an admin never
      // inherits stale elevated flags
      setIsAdmin(false);
      setIsCreator(false);
      setIsChecking(false);
      return;
    }
    // Reset before fetching so flags are never stale during the request
    setIsAdmin(false);
    setIsCreator(false);
    setIsChecking(true);
    apiFetch("/api/users/me")
      .then((r) => r.json() as Promise<{ role: string }>)
      .then((data) => {
        setIsAdmin(data.role === "admin");
        setIsCreator(data.role === "admin" || data.role === "creator");
      })
      .catch(() => {})
      .finally(() => setIsChecking(false));
  }, [user?.id, isLoaded]);

  return { isAdmin, isCreator, isChecking };
}
