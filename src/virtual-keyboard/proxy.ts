import type { VirtualKeyboardMessage } from '../public/virtual-keyboard';

export const VIRTUAL_KEYBOARD_MESSAGE = 'mathlive#virtual-keyboard-message';

export function isVirtualKeyboardMessage(
  evt: Event
): evt is MessageEvent<VirtualKeyboardMessage> {
  if (evt.type !== 'message') return false;

  const msg = evt as MessageEvent<VirtualKeyboardMessage>;

  return msg.data?.type === VIRTUAL_KEYBOARD_MESSAGE;
}
