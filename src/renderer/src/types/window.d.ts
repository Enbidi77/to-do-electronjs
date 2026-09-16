import type { IpcApi, TodoApi } from '@shared/types';

declare global {
  interface Window {
    api: IpcApi;
    todo: TodoApi;
  }
}

