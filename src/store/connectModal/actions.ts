export const CONNECT_MODAL_CLOSE = 'CONNECT_MODAL_CLOSE';
export const CONNECT_MODAL_OPEN = 'CONNECT_MODAL_OPEN';

export function connectModalClose() {
  return {type: CONNECT_MODAL_CLOSE};
}

export function connectModalOpen() {
  return {type: CONNECT_MODAL_OPEN};
}
