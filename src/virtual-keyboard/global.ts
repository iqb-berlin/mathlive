import { isBrowser } from '../ui/utils/capabilities';
import { VirtualKeyboard } from './virtual-keyboard';

export { VirtualKeyboard } from './virtual-keyboard';
//export { VirtualKeyboardProxy } from './proxy';

if (isBrowser() && !('mathVirtualKeyboard' in window)) {
  const kbd = VirtualKeyboard.singleton;
  Object.defineProperty(window, 'mathVirtualKeyboard', {
    get: () => kbd,
  });
}
