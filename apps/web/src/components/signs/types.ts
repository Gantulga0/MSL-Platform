export interface SignItem {
  key: string;
  display: string;
  src: string;
  /** Media kind for `src`. Defaults to 'video' when omitted. */
  kind?: 'image' | 'video';
  ariaLabel: string;
  dialogLabel: string;
}
