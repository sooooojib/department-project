import { SignJWT, jwtVerify } from 'jose';

// Use a fallback secret if environment variable is not defined for development.
// In production, MUST use a secure JWT_SECRET environment variable.
const secretKey = process.env.JWT_SECRET || 'super-secret-department-key';
const key = new TextEncoder().encode(secretKey);

export interface SessionPayload {
    userId: string;
    role: 'STUDENT' | 'TEACHER' | 'CR' | 'ADMIN';
    [key: string]: any;
}

export async function encrypt(payload: SessionPayload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1w')
        .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ['HS256'],
        });
        return payload as unknown as SessionPayload;
    } catch (error) {
        return null;
    }
}
