/**
 * Dialog script data. Easy to add new dialog sequences.
 *
 * Types:
 * - 'thought': Internal monologue (italic, no speaker label)
 * - 'speech':  Character dialog (speaker label shown)
 * - 'choice':  Branch prompt with buttons. The chosen `id` is
 *              passed to the showDialog onComplete callback.
 */

export interface DialogLineThought {
  type: 'thought';
  speaker?: string;
  text: string;
}

export interface DialogLineSpeech {
  type: 'speech';
  speaker?: string;
  text: string;
}

export interface DialogChoice {
  id: string;
  text: string;
}

export interface DialogLineChoice {
  type: 'choice';
  /** Optional prompt text shown above the buttons. */
  text?: string;
  choices: DialogChoice[];
}

export type DialogLine = DialogLineThought | DialogLineSpeech | DialogLineChoice;

export type DialogSequence = DialogLine[];

// --- GRAVEYARD LEVEL DIALOGS ---

export const GRAVEYARD_INTRO: DialogSequence = [
  { type: 'thought', text: 'I have the weirdest job.' },
];

export const GRAVESTONE_INSPECT_1: DialogSequence = [
  { type: 'thought', text: 'Rebecca Johnson. 1942-2025.' },
  { type: 'thought', text: '"Beloved wife and mother." Rest easy, Rebecca.' },
  { type: 'thought', text: 'I should ask him why Im doing this, but I won\'t.' },
  {
    type: 'choice',
    choices: [
      { id: 'collect', text: 'Collect sample' },
      { id: 'decline', text: 'reconsider my life' },
    ],
  },
];

export const GRAVESTONE_INSPECT_2: DialogSequence = [
  { type: 'thought', text: 'Thomas Ashworth. 1867-1903.' },
  { type: 'thought', text: 'The inscription is worn. Something about... "the veil between worlds."' },
  { type: 'thought', text: 'That\'s not creepy at all.' },
];

export const GRAVESTONE_INSPECT_3: DialogSequence = [
  { type: 'thought', text: 'Vera Thorne. 1990-2025.' },
  { type: 'thought', text: '"She left us too early. Her soul will be missed."' },
  { type: 'thought', text: 'Why does he have me doing this stuff.' },
  {
    type: 'choice',
    choices: [
      { id: 'collect', text: 'Collect sample' },
      { id: 'decline', text: 'maybe not....' },
    ],
  },
];

export const GRAVESTONE_INSPECT_4: DialogSequence = [
  { type: 'thought', text: 'Elias Blackwood. 1789-1856.' },
  { type: 'thought', text: '"He who seeks shall find. He who finds shall wish he hadn\'t."' },
  { type: 'thought', text: '...Great. Inspirational.' },
];

export const GRAVESTONE_INSPECT_5: DialogSequence = [
  { type: 'thought', text: 'An unmarked stone. No name, no dates.' },
  { type: 'thought', text: 'Just a symbol I don\'t recognize carved into it.' },
  { type: 'thought', text: 'I should probably leave that alone.' },
];

// Follow-up thought after collecting a sample.
export const SAMPLE_COLLECTED_VERA: DialogSequence = [
  { type: 'thought', text: 'Does this make me a grave robber?' },
];
export const SAMPLE_COLLECTED_REBECCA: DialogSequence = [
  { type: 'thought', text: 'Its just dirt in a jar... right?' },
];

// Extra thought that fires only after the SECOND sample is
// collected, regardless of order, right before the mission toast.
export const SAMPLE_COLLECTED_READY: DialogSequence = [
  { type: 'thought', text: 'Im ready to go.' },
];

// Played the first time the player tries to walk out the gate before
// collecting both soil samples. The soft barrier in GraveyardScene
// stops Gabe roughly half-past the gate and triggers this monologue.
export const GATE_BLOCKED_NO_SAMPLES: DialogSequence = [
  { type: 'thought', text: 'Something is stopping me.' },
  { type: 'thought', text: 'I think its my paycheck.' },
];

export const CARETAKER_HOUSE_DIALOG: DialogSequence = [
  { type: 'thought', text: 'The caretaker\'s house. Lights are on but nobody\'s answering.' },
  { type: 'thought', text: 'Door\'s locked. Figures.' },
];
