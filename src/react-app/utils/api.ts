declare global {
  interface Window {
    __clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      };
    };
  }
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token: string | null = null;
  try {
    token = (await window.__clerk?.session?.getToken()) ?? null;
  } catch {
    // not signed in
  }

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
  let token: string | null = null;
  try {
    token = (await window.__clerk?.session?.getToken()) ?? null;
  } catch {
    // not signed in
  }

  return fetch(url, {
    method: "POST",
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
