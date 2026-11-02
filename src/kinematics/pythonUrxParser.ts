/**
 * Kinematics - Python-urx & Script Execution Engine
 * Emulates the python-urx robotics API and parses sequential commands.
 */

export interface ScriptCommand {
  type: 'movej' | 'gripper' | 'sleep' | 'draw_to' | 'pen_down' | 'pen_up' | 'pen_color' | 'pen_width';
  params: any;
  rawLine: string;
  lineNumber: number;
}

export function parsePythonUrxScript(script: string): { commands: ScriptCommand[]; errors: string[] } {
  const lines = script.split('\n');
  const commands: ScriptCommand[] = [];
  const errors: string[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx].trim();
    if (!rawLine || rawLine.startsWith('#')) continue;

    // rob.movej([q1, q2, ...], a=..., v=...)
    const movejMatch = rawLine.match(/rob\.movej\s*\(\s*\[([^\]]+)\](?:\s*,\s*a\s*=\s*([0-9.]+))?(?:\s*,\s*v\s*=\s*([0-9.]+))?\s*\)/i);
    if (movejMatch) {
      const anglesStr = movejMatch[1].split(',');
      const angles = anglesStr.map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
      const accel = movejMatch[2] ? parseFloat(movejMatch[2]) : 1.0;
      const speed = movejMatch[3] ? parseFloat(movejMatch[3]) : 0.5;

      commands.push({
        type: 'movej',
        params: { angles, accel, speed },
        rawLine,
        lineNumber: idx + 1,
      });
      continue;
    }

    // rob.gripper.move(value)
    const gripperMatch = rawLine.match(/rob\.gripper\.move\s*\(\s*([0-9.]+)\s*\)/i);
    if (gripperMatch) {
      const val = parseFloat(gripperMatch[1]);
      commands.push({
        type: 'gripper',
        params: { openAmount: Math.max(0, Math.min(1, val > 1 ? val / 100 : val)) },
        rawLine,
        lineNumber: idx + 1,
      });
      continue;
    }

    // time.sleep(sec)
    const sleepMatch = rawLine.match(/(?:time\.)?sleep\s*\(\s*([0-9.]+)\s*\)/i);
    if (sleepMatch) {
      const duration = parseFloat(sleepMatch[1]);
      commands.push({
        type: 'sleep',
        params: { duration },
        rawLine,
        lineNumber: idx + 1,
      });
      continue;
    }

    // draw_to(x, y)
    const drawToMatch = rawLine.match(/draw_to\s*\(\s*([0-9.-]+)\s*,\s*([0-9.-]+)\s*\)/i);
    if (drawToMatch) {
      const x = parseFloat(drawToMatch[1]);
      const y = parseFloat(drawToMatch[2]);
      commands.push({
        type: 'draw_to',
        params: { x, y },
        rawLine,
        lineNumber: idx + 1,
      });
      continue;
    }

    // pen_down()
    if (/pen_down\s*\(\s*\)/i.test(rawLine)) {
      commands.push({
        type: 'pen_down',
        params: {},
        rawLine,
        lineNumber: idx + 1,
      });
      continue;
    }

    // pen_up()
    if (/pen_up\s*\(\s*\)/i.test(rawLine)) {
      commands.push({
        type: 'pen_up',
        params: {},
        rawLine,
        lineNumber: idx + 1,
      });
      continue;
    }

    // pen_color("...")
    const colorMatch = rawLine.match(/pen_color\s*\(\s*["']([^"']+)["']\s*\)/i);
    if (colorMatch) {
      commands.push({
        type: 'pen_color',
        params: { color: colorMatch[1] },
        rawLine,
        lineNumber: idx + 1,
      });
      continue;
    }

    // pen_width(...)
    const widthMatch = rawLine.match(/pen_width\s*\(\s*([0-9.]+)\s*\)/i);
    if (widthMatch) {
      commands.push({
        type: 'pen_width',
        params: { width: parseFloat(widthMatch[1]) },
        rawLine,
        lineNumber: idx + 1,
      });
      continue;
    }

    // Ignore boilerplate import lines
    if (/import\s+urx/i.test(rawLine) || /rob\s*=\s*urx\.Robot/i.test(rawLine) || /import\s+math/i.test(rawLine)) {
      continue;
    }

    // Unrecognized command
    errors.push(`Line ${idx + 1}: Unrecognized command "${rawLine}"`);
  }

  return { commands, errors };
}
