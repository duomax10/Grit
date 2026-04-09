/**
 * Dialog script data. Easy to add new dialog sequences.
 *
 * Types:
 * - 'thought': Internal monologue (italic, no speaker label)
 * - 'speech': Character dialog (speaker label shown)
 */

export interface DialogLine {
  type: 'thought' | 'speech';
  speaker?: string;
  text: string;
}

export type DialogSequence = DialogLine[];

// --- GRAVEYARD LEVEL DIALOGS ---

export const GRAVEYARD_INTRO: DialogSequence = [
  { type: 'thought', text: 'I have the weirdest job.' },
];

export const GRAVESTONE_INSPECT_1: DialogSequence = [
  { type: 'thought', text: 'Margaret Holloway. 1842-1891.' },
  { type: 'thought', text: '"Beloved wife and mother." Rest easy, Margaret.' },
];

export const GRAVESTONE_INSPECT_2: DialogSequence = [
  { type: 'thought', text: 'Thomas Ashworth. 1867-1903.' },
  { type: 'thought', text: 'The inscription is worn. Something about... "the veil between worlds."' },
  { type: 'thought', text: 'That\'s not creepy at all.' },
];

export const GRAVESTONE_INSPECT_3: DialogSequence = [
  { type: 'thought', text: 'This one\'s too weathered to read.' },
  { type: 'thought', text: 'Looks old. Really old.' },
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

export const CARETAKER_HOUSE_DIALOG: DialogSequence = [
  { type: 'thought', text: 'The caretaker\'s house. Lights are on but nobody\'s answering.' },
  { type: 'thought', text: 'Door\'s locked. Figures.' },
];
