import { User, LoginCredentialsDto, SignupDto } from '@erankup/shared';

// Re-export for convenience so imports in other files still work
export type { User, LoginCredentialsDto, SignupDto };

export interface LoginResponse {
    access_token: string;
    user: User;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (credentials: LoginCredentialsDto) => Promise<void>;
    signup: (data: SignupDto) => Promise<void>;
    logout: () => void;
    setUser: (user: User | null) => void;
}
