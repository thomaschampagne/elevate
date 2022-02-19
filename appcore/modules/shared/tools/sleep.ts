export const sleep = (milliseconds: number = 0): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};
