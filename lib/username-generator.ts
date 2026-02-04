export function generateUsername(name: string): string {
    // Remove special chars, keep only alphanumeric, lowercase
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    // Add random 4 digit number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${base}${randomSuffix}`;
}
