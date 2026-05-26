import { graphqlFetch } from '@/lib/graphql-client';

export async function logoutSession(): Promise<{ serverError: boolean }> {
  const accessToken =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  if (!accessToken) {
    clearAuthStorage();
    return { serverError: false };
  }

  try {
    const result = await graphqlFetch({ query: 'mutation Logout { logout }' }, { withAuth: true });
    clearAuthStorage();
    return { serverError: !result.ok && Boolean(result.errors?.length) };
  } catch {
    clearAuthStorage();
    return { serverError: true };
  }
}

export function clearAuthStorage(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('gaming-hub-auth'));
}
