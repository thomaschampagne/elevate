import "jest-preset-angular/setup-jest";

/**
 * Common
 */
// Css
Object.defineProperty(window, "CSS", { value: null });

Object.defineProperty(window, "getComputedStyle", {
  value: () => ({
    getPropertyValue: () => {
      return null;
    }
  })
});

// Local storage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: key => store[key],
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: key => {
      delete store[key];
    }
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Html
Object.defineProperty(document, "doctype", {
  value: "<!DOCTYPE html>"
});
Object.defineProperty(document.body.style, "transform", {
  value: () => {
    return {
      enumerable: true,
      configurable: true
    };
  }
});

/**
 * Desktop
 */
// Electron
Object.defineProperty(window, "require", {
  value: () => (module: string) => {
    console.log("Loading require module: " + module);
    return {};
  }
});

// Mapbox and controls lib
jest.mock("mapbox-gl/dist/mapbox-gl", () => () => {});
jest.mock("mapbox-gl-controls/lib", () => {});
