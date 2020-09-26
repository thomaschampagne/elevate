export const dirname = (path: string) => {
  if (!path) {
    return null;
  }
  const matchArray = path.match(/.*\//);
  return matchArray ? matchArray[0] : null;
};
