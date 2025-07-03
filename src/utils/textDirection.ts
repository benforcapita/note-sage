// Utility functions for text direction detection
export function detectTextDirection(text: string): 'ltr' | 'rtl' {
  // Hebrew Unicode range: \u0590-\u05FF
  // Arabic Unicode range: \u0600-\u06FF
  const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF]/;
  
  // Check if text contains RTL characters
  return rtlRegex.test(text) ? 'rtl' : 'ltr';
}

export function getTextAlignment(direction: 'ltr' | 'rtl'): 'left' | 'right' {
  return direction === 'rtl' ? 'right' : 'left';
}

export function getTextDirectionClass(text: string): string {
  const direction = detectTextDirection(text);
  return direction === 'rtl' ? 'rtl-text' : 'ltr-text';
}