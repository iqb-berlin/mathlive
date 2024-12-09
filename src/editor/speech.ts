import type { SpeechScope } from '../public/commands';

import type { Atom } from '../core/atom';

import type { _Mathfield } from '../editor-mathfield/mathfield-private';

import { atomToSpeakableText } from '../formats/atom-to-speakable-text';
import { register as registerCommand } from './commands';
import { render } from '../editor-mathfield/render';
import { isBrowser } from '../ui/utils/capabilities';
import { globalMathLive } from '../mathlive';

declare global {
  interface Window {
    AWS: { [key: string]: any };
  }
}

/**
 *
 * Speak some part of the expression, either with or without synchronized highlighting.
 *
 * @param speakOptions.withHighlighting - If true, synchronized
 * highlighting of speech will happen (if possible). Default is false.
 */

registerCommand(
  {
    speak: (
      mathfield: _Mathfield,
      scope: SpeechScope,
      options: { withHighlighting: boolean }
    ): boolean => {
      return speak(mathfield, scope, options);
    },
  },
  { target: 'mathfield' }
);

function speak(
  mathfield: _Mathfield,
  scope: SpeechScope,
  speakOptions: { withHighlighting: boolean }
): boolean {
  speakOptions = speakOptions ?? { withHighlighting: false };
  const { model } = mathfield;
  function getAtoms(scope: SpeechScope): Atom | Readonly<Atom[]> | null {
    let result: Atom | Readonly<Atom[]> | null = null;
    switch (scope) {
      case 'all':
        result = model.root;
        break;

      case 'selection':
        result = model.getAtoms(model.selection);
        break;

      case 'left': {
        result = model.getAtoms(
          model.offsetOf(model.at(model.position).leftSibling),
          model.position
        );
        break;
      }

      case 'right': {
        result = model.getAtoms(
          model.position,
          model.offsetOf(model.at(model.position).rightSibling)
        );
        break;
      }

      case 'group':
        result = model.getAtoms(model.getSiblingsRange(model.position));
        break;

      case 'parent': {
        const { parent } = model.at(model.position);
        if (parent?.parent) result = parent;
        else result = model.root;

        break;
      }
      default:
        result = model.root;
    }

    return result;
  }

  function getFailedSpeech(scope: SpeechScope): string {
    let result = '';
    switch (scope) {
      case 'all':
        console.error('Internal failure: speak all failed');
        break;
      case 'selection':
        result = 'no selection';
        break;
      case 'left':
        result = 'at start';
        break;
      case 'right':
        result = 'at end';
        break;
      case 'group':
        console.error('Internal failure: speak group failed');
        break;
      case 'parent':
        result = 'no parent';
        break;
      default:
        console.error('unknown speak_ param value: "' + scope + '"');
        break;
    }

    return result;
  }

  const mfe = globalThis.MathfieldElement;

  const atoms = getAtoms(scope);
  if (atoms === null) {
    mfe.speakHook?.(getFailedSpeech(scope));
    return false;
  }

  if (speakOptions.withHighlighting || mfe.speechEngine === 'amazon') {
    mfe.textToSpeechMarkup =
      globalThis.sre && mfe.textToSpeechRules === 'sre' ? 'ssml_step' : 'ssml';
  }

  const text = atomToSpeakableText(atoms);
  if (isBrowser() && speakOptions.withHighlighting) {
    globalMathLive().readAloudMathfield = mathfield;
    render(mathfield, { forHighlighting: true });
    if (mfe.readAloudHook) mfe.readAloudHook(mathfield.field!, text);
  } else if (mfe.speakHook) mfe.speakHook(text);

  return false;
}
