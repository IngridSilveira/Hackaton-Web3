import type { JwtResponse, NonceResponse, UserResponse } from '../types/backend';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8080';

const defaultHeaders = {
    'Content-Type': 'application/json',
};

export async function requestNonce(address: string): Promise<NonceResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/nonce/${address}`);
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Falha ao obter nonce do backend.');
    }
    return response.json();
}

export async function authenticateWallet(address: string, signature: string, message: string): Promise<JwtResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/wallet`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({ address, signature, message }),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Falha ao autenticar usuário.');
    }

    return response.json();
}

export async function getUserProfile(address: string, token: string): Promise<UserResponse> {
    const response = await fetch(`${API_BASE_URL}/api/users/${address}`, {
        headers: {
            ...defaultHeaders,
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Falha ao buscar usuário no backend.');
    }

    return response.json();
}

export async function getOngs(token?: string): Promise<UserResponse[]> {
    const headers: Record<string, string> = { ...defaultHeaders };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/api/users/ongs`, { headers });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Falha ao buscar ONGs no backend.');
    }
    return response.json();
}
