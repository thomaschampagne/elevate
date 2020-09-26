/**
 * Find percentile of a number array already sorted (ascending)
 */
export function percentile(sortedArrayAsc: number[], requestedPercentile: number): number {
  const index = requestedPercentile * sortedArrayAsc.length;
  let result;
  if (Math.floor(index) === index) {
    result = (sortedArrayAsc[index - 1] + sortedArrayAsc[index]) / 2;
  } else {
    result = sortedArrayAsc[Math.floor(index)];
  }
  return result;
}
