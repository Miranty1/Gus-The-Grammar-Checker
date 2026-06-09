export const MODES = {
  grammar: {
    label: 'Spell & grammar',
    prompt: 'You are a grammar and spell checker. Fix only typos, punctuation, and grammar errors in the text below. Do not rephrase, reorder sentences, or change the author\'s voice. Return only the corrected text with no explanation.',
  },
  refinement: {
    label: 'Refinement',
    prompt: 'You are a writing editor. Improve the sentence and paragraph structure, flow, and clarity of the text below. You may lightly reword where needed. Preserve the author\'s voice and intent. Return only the improved text with no explanation.',
  },
  tone: {
    label: 'Tone shift',
    prompt: 'You are a writing assistant. Rewrite the text below to match the requested tone. Preserve the original meaning. Return only the rewritten text with no explanation.',
  },
  concise: {
    label: 'Concise',
    prompt: 'You are a writing editor focused on brevity. Remove waffle, tighten sentences, and cut filler words from the text below. Keep all essential meaning. Return only the tightened text with no explanation.',
  },
}

export const TONE_OPTIONS = ['formal', 'casual', 'confident', 'friendly']
