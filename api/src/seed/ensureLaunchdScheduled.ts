import fs from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const JOB_LABEL = "me.persistentscreenti.me";

const RUN_INTERVAL_SECONDS = 60 * 60 * 24;

const HOME_DIR = os.homedir();
const PLIST_DIR = path.join(HOME_DIR, "Library", "LaunchAgents");
const PLIST_PATH = path.join(PLIST_DIR, `${JOB_LABEL}.plist`);

async function ensureLaunchdScheduled() {
  if (fs.existsSync(PLIST_PATH)) {
    console.log(`[Launchd] Job ${JOB_LABEL} is already installed.`);
    return;
  }

  console.log("[Launchd] Installing background job...");

  const nodePath = process.execPath;
  const scriptPath = path.resolve(process.argv[1]);

  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
        <key>Label</key>
        <string>${JOB_LABEL}</string>
        
        <key>ProgramArguments</key>
        <array>
            <string>${nodePath}</string>
            <string>${scriptPath}</string>
        </array>
        
        <key>StartInterval</key>
        <integer>${RUN_INTERVAL_SECONDS}</integer>
        
        <key>StandardOutPath</key>
        <string>/tmp/${JOB_LABEL}.out.log</string>
        <key>StandardErrorPath</key>
        <string>/tmp/${JOB_LABEL}.err.log</string>
    </dict>
    </plist>`;

  try {
    if (!fs.existsSync(PLIST_DIR)) {
      fs.mkdirSync(PLIST_DIR, { recursive: true });
    }

    fs.writeFileSync(PLIST_PATH, plistContent, "utf8");

    await execAsync(`launchctl load ${PLIST_PATH}`);
    console.log(
      `[Launchd] Successfully scheduled to run every ${RUN_INTERVAL_SECONDS} seconds!`,
    );
  } catch (error) {
    console.error("[Launchd] Failed to install job:", error);
  }
}

export default ensureLaunchdScheduled;
