/**
 * Run all timers and those which are created during runs
 * @param depth - Number of times to allow events to be added
 */
export const runAllTimersRecursive = async (depth = 3): Promise<void> => {
    await new Promise(resolve => process.nextTick(resolve));
    jest.runAllTimers();
    if (depth > 1) {
        return runAllTimersRecursive(depth - 1);
    }
};
