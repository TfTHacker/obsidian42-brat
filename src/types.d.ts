import type BratApi from './utils/BratAPI';

declare global {
  interface Window {
    bratAPI?: BratApi;
  }
}
