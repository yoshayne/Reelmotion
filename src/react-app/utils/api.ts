declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      };
    };
  }
}

async function getAuthToken(): Promise<string | null> {
  try {
    let token = await window.Clerk?.session?.getToken() ?? null;
    if (!token) {
      // Clerk marks isSignedIn=true slightly before the session token is ready.
      // Wait up to 1.5s in 150ms increments for the token to become available.
      for (let i = 0; i < 10 && !token; i++) {
        await new Promise(r => setTimeout(r, 150));
        token = await window.Clerk?.session?.getToken() ?? null;
      }
    }
    return token;
  } catch {
    return null;
  }
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export async function apiFetchForm(url: string, formData: FormData): Promise<Response> {
  const token = await getAuthToken();

  return fetch(url, {
    method: "POST",
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
