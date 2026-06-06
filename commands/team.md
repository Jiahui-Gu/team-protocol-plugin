---
description: Toggle team-protocol enforcement (SessionStart + PostCompact injection). Two scopes — session (default) or global. Usage: /team [on|off] [global]. No arg = show status.
allowed-tools: Bash(touch:*), Bash(rm:*), Bash(test:*), Bash(ls:*), Bash(sh:*), Bash(mkdir:*)
---

Run exactly this shell pipeline and report only the final line(s) of output to the user. Do not run any other tools.

```bash
sh -c '
DIR=~/.claude/hooks/state
mkdir -p "$DIR"
GLOBAL_FLAG="$DIR/team-protocol.flag"
sid="${CLAUDE_CODE_SESSION_ID:-nosession}"
SESSION_FLAG="$DIR/team-protocol.$sid.flag"

args="$ARGUMENTS"
action=""; scope=""
for w in $args; do
  case "$w" in
    on|off)              action="$w" ;;
    global|g|-g)         scope="global" ;;
    session|s|-s|local)  scope="session" ;;
    *) echo "usage: /team [on|off] [global|session]"; exit 2 ;;
  esac
done

case "$scope" in
  global) FLAG="$GLOBAL_FLAG"; label="global" ;;
  *)      FLAG="$SESSION_FLAG"; label="session" ;;
esac

status() {
  test -f "$GLOBAL_FLAG"  && g="ON"  || g="OFF"
  test -f "$SESSION_FLAG" && s="ON"  || s="OFF"
  if [ "$g" = "ON" ] || [ "$s" = "ON" ]; then eff="ON"; else eff="OFF"; fi
  echo "team-protocol: $eff  (global: $g, session: $s)"
}

case "$action" in
  on)  touch "$FLAG"; echo "team-protocol $label: ON"; status ;;
  off) rm -f "$FLAG"; echo "team-protocol $label: OFF"; status ;;
  "")  status ;;
  *)   echo "usage: /team [on|off] [global|session]"; exit 2 ;;
esac
'
```
