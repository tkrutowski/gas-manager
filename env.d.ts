/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css' {
  const content: Record<string, never>;
  export default content;
}

declare module 'leaflet/dist/leaflet.css' {
  const content: Record<string, never>;
  export default content;
}
