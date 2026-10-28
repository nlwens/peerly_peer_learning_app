export type RegisterCredentials = {
  email: string;
  password: string;
};

type RegisterDraftState = {
  credentials: RegisterCredentials | null;
  profileImageUrl: string | null;
};

const state: RegisterDraftState = {
  credentials: null,
  profileImageUrl: null,
};

export function setRegisterCredentials(data: RegisterCredentials) {
  state.credentials = data;
}

export function getRegisterCredentials(): RegisterCredentials | null {
  return state.credentials;
}

export function setRegisterProfileImage(uri: string | null) {
  state.profileImageUrl = uri;
}

export function getRegisterProfileImage(): string | null {
  return state.profileImageUrl;
}
