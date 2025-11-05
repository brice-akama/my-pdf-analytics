export const authProvider = {
  login: async ({ email, password }: { email: string; password: string }) => {
    const response = await fetch('/api/auth/secure-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Invalid credentials');
    }
  },

  logout: async () => {
    await fetch('/api/auth/logouts', {
      method: 'POST',
      credentials: 'include',
    });
    return Promise.resolve();
  },

  checkAuth: async () => {
    try {
      const response = await fetch('/api/protected', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        return Promise.reject('Not authenticated');
      }

      return Promise.resolve();
    } catch (error) {
      return Promise.reject('Error validating token');
    }
  },

  checkError: (error: unknown) => {
    if (
      typeof error === "object" &&
      error !== null &&
      'status' in error &&
      ((error as { status?: number }).status === 401 ||
       (error as { status?: number }).status === 403)
    ) {
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getPermissions: () => Promise.resolve(),
};