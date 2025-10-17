export type CommandStatus = 'ok' | 'error';

export type CommandPermission = 'member' | 'admin' | 'owner';

export interface CommandMetadata {
  name: string;
  aliases?: string[];
  args: string;
  desc: string;
  perm: CommandPermission;
}

export interface ParsedCommand {
  command: string;
  args: string[];
  raw: string;
}

export interface CommandContext {
  groupId: string;
  userId: string;
  messageId?: string;
  raw: string;
}

export interface CommandResult {
  status: CommandStatus;
  message: string;
  detail?: string;
  data?: any;
}

export interface SystemMessage {
  type: 'system';
  content: string;
  command?: string;
  data?: any;
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining?: number;
  resetAt?: Date;
}
