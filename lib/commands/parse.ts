import { ParsedCommand } from './types';

/**
 * Parse command text into command and arguments
 * Supports: /command arg1 arg2
 * Also: @system command arg1 arg2
 */
export function parseCommand(text: string): ParsedCommand | null {
  const trimmed = text.trim();

  // Match /command or @system command
  const slashMatch = trimmed.match(/^\/(\w+)\s*(.*)/);
  const systemMatch = trimmed.match(/^@system\s+(\w+)\s*(.*)/i);

  const match = slashMatch || systemMatch;

  if (!match) {
    return null;
  }

  const [, command, argsString] = match;

  // Parse arguments (respecting quotes)
  const args = parseArgs(argsString);

  return {
    command: command.toLowerCase(),
    args,
    raw: trimmed,
  };
}

/**
 * Parse arguments respecting quoted strings
 */
function parseArgs(argsString: string): string[] {
  if (!argsString.trim()) {
    return [];
  }

  const args: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];

    if ((char === '"' || char === "'") && !inQuote) {
      inQuote = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuote) {
      inQuote = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuote) {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    args.push(current);
  }

  return args;
}

/**
 * Check if text is an agent mention
 * Supports: @agent question or @chat question
 */
export function parseAgentMention(text: string): string | null {
  const trimmed = text.trim();
  const match = trimmed.match(/^@(agent|chat)\s+(.+)/i);

  if (match) {
    return match[2]; // Return the question part
  }

  return null;
}

/**
 * Extract all commands from text (for autocomplete)
 */
export function extractCommandPrefix(text: string): string | null {
  const match = text.match(/^\/(\w*)$/);
  return match ? match[1] : null;
}
