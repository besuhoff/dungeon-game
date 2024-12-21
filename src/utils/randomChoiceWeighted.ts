/**
 * Makes a weighted random choice from a record of options with their weights.
 * Higher weights mean higher probability of being chosen.
 * 
 * @param options Record where keys are options and values are their weights
 * @returns The chosen key or undefined if options is empty
 * 
 * @example
 * const options = { a: 5, b: 1 }; // 'a' is 5 times more likely to be chosen than 'b'
 * const choice = randomChoiceWeighted(options); // returns 'a' or 'b'
 */
export function randomChoiceWeighted<T extends string | number>(options: Partial<Record<T, number>>): T | undefined {
    const entries = Object.entries(options) as [T, number][];
    if (entries.length === 0) {
        return undefined;
    }

    const totalWeight = entries.reduce((sum, [_, weight]) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (const [option, weight] of entries) {
        random -= weight;
        if (random <= 0) {
            return option;
        }
    }

    // In case of floating point precision issues, return the last option
    return entries[entries.length - 1][0];
}
