export const MODES = {
  grammar: {
    label: 'Spell & grammar',
    prompt: 'You are a grammar and spell checker using Australian English. Fix only typos, punctuation, and grammar errors in the text below. Use Australian English spelling throughout (e.g. "colour" not "color", "organise" not "organize", "realise" not "realize"). Do not rephrase, reorder sentences, or change the author\'s voice. Return only the corrected text with no explanation.',
  },
  refinement: {
    label: 'Refinement',
    prompt: 'You are a writing editor using Australian English. Improve the sentence and paragraph structure, flow, and clarity of the text below. Use Australian English spelling throughout (e.g. "colour" not "color", "organise" not "organize"). You may lightly reword where needed. Preserve the author\'s voice and intent. Return only the improved text with no explanation.',
  },
  tone: {
    label: 'Tone shift',
    prompt: 'You are a writing assistant using Australian English. Rewrite the text below in a {{tone}} tone. Use Australian English spelling throughout (e.g. "colour" not "color", "organise" not "organize"). Preserve the original meaning. Return only the rewritten text with no explanation.',
  },
  concise: {
    label: 'Concise',
    prompt: 'You are a writing editor focused on brevity, using Australian English. Remove waffle, tighten sentences, and cut filler words from the text below. Use Australian English spelling throughout (e.g. "colour" not "color", "organise" not "organize"). Keep all essential meaning. Return only the tightened text with no explanation.',
  },
}

export const TONE_OPTIONS = ['formal', 'casual', 'confident', 'friendly']
