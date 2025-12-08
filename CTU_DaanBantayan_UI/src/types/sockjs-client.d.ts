declare module 'sockjs-client' {
  interface SockJSOptions {
    server?: string;
    sessionId?: number | (() => string);
    transports?: string | string[];
    timeout?: number;
  }

  class SockJS {
    constructor(url: string, _reserved?: any, options?: SockJSOptions);
    readyState: number;
    onopen: ((e: Event) => void) | null;
    onmessage: ((e: MessageEvent) => void) | null;
    onclose: ((e: CloseEvent) => void) | null;
    send(data: string): void;
    close(code?: number, reason?: string): void;
  }

  export = SockJS;
}
