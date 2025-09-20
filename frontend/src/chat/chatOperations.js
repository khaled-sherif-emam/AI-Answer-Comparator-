
/**
 * Generates initials from a name string
 * @param {string} name - The full name to generate initials from
 * @returns {string} The initials (first letter of first two words for names with 2+ words, first letter for single word)
 */
export function getInitials(name) {
    if (!name || typeof name !== 'string') return '';
    
    // Split the name into words and filter out any empty strings
    const words = name.trim().split(/\s+/).filter(word => word.length > 0);
    
    // If no valid words, return empty string
    if (words.length === 0) return '';
    
    // For single word, return first character (uppercase)
    if (words.length === 1) {
        return words[0].charAt(0).toUpperCase();
    }
    
    // For two or more words, return first character of first two words
    return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
}