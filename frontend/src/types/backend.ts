export interface NonceResponse {
    nonce: string;
    message: string;
}

export interface JwtResponse {
    token: string;
    type: string;
    expiresIn: number;
}

export interface UserResponse {
    address: string;
    username: string;
    userType: string;
    createdAt: string;
}
