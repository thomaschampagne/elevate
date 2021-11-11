/**
 * Smooth a vector stream using average next vector values in the window
 */
export const meanWindowSmoothing = (array: number[], windowSize: number = 3, roundDecimals: number = 3): number[] => {
  const roundDecimalsFactor = 10 ** roundDecimals;
  return array.map((value: number, index: number) => {
    const window = array.slice(index, index + windowSize); // Get window
    const mean = window.reduce((a: number, b: number) => a + b, 0) / window.length; // mean of window
    return Math.round(mean * roundDecimalsFactor) / roundDecimalsFactor; // Round and return
  });
};
