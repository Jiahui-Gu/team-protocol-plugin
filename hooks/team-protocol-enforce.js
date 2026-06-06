#!/usr/bin/env node
// SessionStart + PostCompact hook: inject the team-protocol entry point ONCE
// at session start and ONCE right after each compaction, gated by a flag file.
//
// Flag-driven (mirrors the /night switch model):
//   ~/.claude/hooks/state/team-protocol.flag           -> global ON
//   ~/.claude/hooks/state/team-protocol.<sid>.flag    -> session ON
// OR semantics. No flag = no injection (silent no-op).
//
// Toggle with /team [on|off] [global|session].
//
// The skill is shipped with this plugin; we resolve SKILL.md via the
// CLAUDE_PLUGIN_ROOT env var that Claude Code sets when invoking plugin hooks.
// If the env var is unset or the file is missing, exit 0 silently (fail-safe).

const fs = require('fs');
const os = require('os');
const path = require('path');

let stdinRaw = '';
try {
  stdinRaw = fs.readFileSync(0, 'utf8');
} catch {}
let data = {};
try {
  data = stdinRaw ? JSON.parse(stdinRaw) : {};
} catch {}

const STATE_DIR = path.join(os.homedir(), '.claude', 'hooks', 'state');
const GLOBAL_FLAG = path.join(STATE_DIR, 'team-protocol.flag');
const sid = data.session_id || process.env.CLAUDE_CODE_SESSION_ID || '';
const SESSION_FLAG = sid ? path.join(STATE_DIR, `team-protocol.${sid}.flag`) : '';

const flagOn = (() => {
  try { if (fs.statSync(GLOBAL_FLAG).isFile()) return true; } catch {}
  if (SESSION_FLAG) {
    try { if (fs.statSync(SESSION_FLAG).isFile()) return true; } catch {}
  }
  return false;
})();

if (!flagOn) {
  process.exit(0);
}

const skillPath = path.join(process.env.CLAUDE_PLUGIN_ROOT || '', 'skills', 'team-protocol', 'SKILL.md');

try {
  if (!fs.statSync(skillPath).isFile()) {
    process.exit(0);
  }
} catch {
  process.exit(0);
}

const context = [
  '【强制 — team-protocol 协作协议】涉及多步开发、派 subagent、写代码、开 PR、review、merge 之前,',
  '你必须先用 Read 工具读完 ' + skillPath + ' 判断自己的身份(manager / dev / reviewer),',
  '再读对应的 references 文件,并严格遵守。主会话(跟用户对话的你)= manager。',
  '关键纪律:manager 自己不下场写代码、不 merge;merge 由独立 spawn 的 reviewer subagent 完成。',
  '此规则常驻,扛 compact——即使上下文被压缩也必须遵守。',
].join('');

const eventName = data.hook_event_name || 'SessionStart';
const out = {
  hookSpecificOutput: {
    hookEventName: eventName,
    additionalContext: context,
  },
};

process.stdout.write(JSON.stringify(out));
process.exit(0);
