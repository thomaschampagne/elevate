const median = (inputArray: number[]): number => {
  const s = inputArray.slice().sort((a: number, b: number) => {
    return a - b;
  });
  return s[Math.floor((s.length - 1) / 2)];
};

/**
 * Remove spikes into a vector (http://fourier.eng.hmc.edu/e161/lectures/smooth_sharpen/node2.html)
 * @param array to be filtered
 * @param window Window size (should be odd number)
 */
export const medianFilter = (array: number[], window: number = 3) => {
  if (window % 2 === 0) {
    throw new Error("Window size should be an odd number");
  }

  if (array.length < window) {
    return array;
  }
  const f = [];
  const w = [];
  let i;
  w.push(array[0]);
  for (i = 0; i < array.length; i++) {
    if (array.length - 1 >= i + Math.floor(window / 2)) w.push(array[i + Math.floor(window / 2)]);
    f.push(median(w));
    if (i >= Math.floor(window / 2)) w.shift();
  }
  return f;
};
