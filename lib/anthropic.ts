import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic;

export function getClaudeClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
