
export const isValidEmail = (email: string): boolean => {
    // Regex for robust email validation
    // Matches: standard limits but allows aliases (+) and long TLDs
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};
