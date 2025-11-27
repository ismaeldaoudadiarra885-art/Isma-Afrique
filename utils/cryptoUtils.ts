
/**
 * Génère un hash SHA-256 pour une chaîne de données donnée.
 * Utilisé pour sceller numériquement les soumissions et garantir leur intégrité.
 * @param data La chaîne de caractères à hacher (ex: JSON stringified).
 * @returns Une promesse qui résout vers le hash hexadécimal.
 */
export const createHash = async (data: string): Promise<string> => {
    // Encodage de la chaîne en tableau d'octets
    const msgBuffer = new TextEncoder().encode(data);

    // Hachage asynchrone via l'API Web Crypto native du navigateur
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // Conversion du buffer en tableau d'octets
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // Conversion des octets en chaîne hexadécimale
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
};

/**
 * Vérifie si les données correspondent à un hash donné.
 */
export const verifyHash = async (data: string, hash: string): Promise<boolean> => {
    const computedHash = await createHash(data);
    return computedHash === hash;
};
