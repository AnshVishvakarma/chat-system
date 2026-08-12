/// <reference types="next" />
/// <reference types="next/types/global" />

// CSS modules
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// SCSS modules
declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

// LESS modules
declare module '*.less' {
  const content: { [className: string]: string };
  export default content;
}

// Image imports
declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}