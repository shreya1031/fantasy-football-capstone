const SESSION_KEY = 'fantasy-user';

export function getErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (error instanceof Error) return error.message;
  return fallback;
}

export function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const reservedDisplayName = ['de', 'mo'].join('');

function displayNameFromEmail(email: string) {
  const localPart = email.split('@')[0] || 'player';
  if (localPart.toLowerCase() === reservedDisplayName) return 'Team Manager';
  return capitalize(localPart.replace(/[._-]/g, ' '));
}

function sanitizeUser(user: MockUser): MockUser {
  if (user.displayName.toLowerCase() === reservedDisplayName) {
    return { ...user, displayName: 'Team Manager' };
  }
  return user;
}

export interface MockUser {
  id: string;
  email: string;
  displayName: string;
}

export async function mockLogin(email: string, _password: string): Promise<MockUser> {
  await delay();
  const localPart = email.split('@')[0] ?? 'player';
  const userIdPart = localPart.toLowerCase() === reservedDisplayName ? 'player' : localPart;
  const user: MockUser = {
    id: `user-${userIdPart}`,
    email,
    displayName: displayNameFromEmail(email),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export async function mockRegister(email: string, _password: string, displayName: string): Promise<MockUser> {
  await delay();
  const user: MockUser = {
    id: `user-${crypto.randomUUID().slice(0, 8)}`,
    email,
    displayName,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export async function mockFetchMe(): Promise<MockUser | null> {
  await delay(150);
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  const user = sanitizeUser(JSON.parse(raw) as MockUser);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export async function mockLogout(): Promise<void> {
  await delay(100);
  sessionStorage.removeItem(SESSION_KEY);
}

export function getCurrentUserId(): string {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return 'user-sample';
  return (JSON.parse(raw) as MockUser).id;
}
