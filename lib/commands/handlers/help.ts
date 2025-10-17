import { CommandContext, CommandResult } from '../types';
import { getAllCommands } from '../registry';

export async function handleHelp(
  ctx: CommandContext,
  args: string[]
): Promise<CommandResult> {
  const commands = getAllCommands();

  const helpText = commands
    .map((cmd) => {
      const aliases = cmd.aliases?.length ? ` (${cmd.aliases.join(', ')})` : '';
      return `**/${cmd.name}${aliases}** ${cmd.args}\n  ${cmd.desc}`;
    })
    .join('\n\n');

  return {
    status: 'ok',
    message: `## Available Commands\n\n${helpText}\n\n💡 Type \`/command\` to execute or \`@agent question\` to ask the AI.`,
  };
}
