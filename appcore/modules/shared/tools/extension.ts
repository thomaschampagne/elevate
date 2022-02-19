import { basename } from "./basename";

export const extension = (path: string) => {
  const fileBasename = basename(path);
  if (fileBasename.indexOf(".") === -1) {
    return null;
  }
  const basenameArr = fileBasename.split(".");
  return basenameArr.length ? basenameArr[basenameArr.length - 1].toLowerCase() : null;
};
