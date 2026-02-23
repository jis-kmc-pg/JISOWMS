declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /**
       * Backend API URL
       * @default "http://localhost:4000"
       */
      NEXT_PUBLIC_API_URL: string;
    }
  }
}

export {};
