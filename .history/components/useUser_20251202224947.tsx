// components/useUser.tsx (simple hook)
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function useUser() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (isMounted) {
        setUser(data?.user ?? null);
      }
    };

    loadUser();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user: User | null } | null) => {
        if (isMounted) {
          setUser(session?.user ?? null);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.subscription.unsubscribe();
    };
  }, [supabase]);

  return user;
}
