export function isValidBase64(str: string): boolean {
    try {
        return btoa(atob(str)) === str;
    } catch (e) {
        return false;
    }
}
