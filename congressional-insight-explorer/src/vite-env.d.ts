/// <reference types="vite/client" />

// JSON module declarations
declare module "*.jsonld" {
  const content: any;
  export default content;
}

declare module "*.json" {
  const content: any;
  export default content;
}