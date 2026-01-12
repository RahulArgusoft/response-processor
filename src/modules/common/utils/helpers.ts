/**
 * Utility to safely parse JSON
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        return JSON.parse(json);
    } catch {
        return fallback;
    }
}

/**
 * Generate a unique ID with a prefix
 */
export function generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Extract email address from a formatted email string
 * e.g., "John Doe <john@example.com>" -> "john@example.com"
 */
export function extractEmailAddress(formattedEmail: string): string {
    const match = formattedEmail.match(/<([^>]+)>/);
    return match ? match[1] : formattedEmail.trim();
}
