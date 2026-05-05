import mockRouter from "next-router-mock";

let mockParams: Record<string, string | string[] | undefined> = { id: "test-game" };

export function setMockNavigationParams(next: Record<string, string | string[] | undefined>) {
  mockParams = { ...next };
}

export function resetMockNavigationParams() {
  mockParams = { id: "test-game" };
}

export const useRouter = () => mockRouter;

export function useParams<
  T extends Record<string, string | string[] | undefined> = Record<string, string | string[] | undefined>,
>() {
  return mockParams as T;
}

let mockSearchParams = new URLSearchParams();

export function resetMockSearchParams() {
  mockSearchParams = new URLSearchParams();
}

export function setMockSearchParams(entries: Record<string, string>) {
  mockSearchParams = new URLSearchParams(entries);
}

export function useSearchParams() {
  return mockSearchParams;
}
