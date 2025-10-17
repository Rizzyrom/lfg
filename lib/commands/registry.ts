import { CommandMetadata } from './types';

export const COMMANDS: readonly CommandMetadata[] = [
  {
    name: 'help',
    aliases: ['?'],
    args: '',
    desc: 'List available commands',
    perm: 'member',
  },
  {
    name: 'summarize',
    aliases: ['sum'],
    args: '[N]',
    desc: 'Summarize last N messages (default: 100)',
    perm: 'member',
  },
  {
    name: 'analyze',
    aliases: ['a'],
    args: '[symbol|url]',
    desc: 'Analyze a ticker or linked article',
    perm: 'member',
  },
  {
    name: 'alert',
    args: '[SYMBOL] [>PRICE|<PRICE|keyword:WORD]',
    desc: 'Create a price/keyword alert',
    perm: 'member',
  },
  {
    name: 'pin',
    args: '',
    desc: 'Pin selected message',
    perm: 'member',
  },
  {
    name: 'snapshot',
    aliases: ['snap'],
    args: '',
    desc: 'Save recent chat as a feed note',
    perm: 'member',
  },
  {
    name: 'whois',
    args: '[@handle|r/sub]',
    desc: 'Lookup X/Reddit account and subscribe',
    perm: 'member',
  },
  {
    name: 'feed',
    args: 'refresh',
    desc: 'Refresh public feed via n8n',
    perm: 'member',
  },
  {
    name: 'context',
    args: 'on|off',
    desc: 'Toggle chat memory for agent',
    perm: 'member',
  },
  {
    name: 'ask',
    aliases: ['q'],
    args: '<question>',
    desc: 'Ask the agent a question',
    perm: 'member',
  },
] as const;

export function findCommand(nameOrAlias: string): CommandMetadata | undefined {
  const normalized = nameOrAlias.toLowerCase();
  return COMMANDS.find(
    (cmd) =>
      cmd.name === normalized ||
      cmd.aliases?.some((alias) => alias === normalized)
  );
}

export function getAllCommands(): readonly CommandMetadata[] {
  return COMMANDS;
}
