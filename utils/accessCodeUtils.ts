import { v4 as uuidv4 } from 'uuid';

export const generateAccessCode = (): string => {
    // Generate a unique 8-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

export const validateAccessCode = (code: string): boolean => {
    // Check if code is 8 characters, alphanumeric, uppercase
    const regex = /^[A-Z0-9]{8}$/;
    return regex.test(code);
};

export const formatAccessCode = (code: string): string => {
    // Format as XXXX-XXXX for display
    if (code.length === 8) {
        return `${code.slice(0, 4)}-${code.slice(4)}`;
    }
    return code;
};
