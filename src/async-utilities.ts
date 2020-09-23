/**
 * Sleep for a particular amount of time
 * @param delay - Time delay to sleep for in milliseconds
 */
export const sleep = (delay: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, delay));
