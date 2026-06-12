import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import dotenv from "dotenv";

dotenv.config();

const execAsync = promisify(exec);

function relocateFile(
  rootDir: string,
  filePath: string,
  device: "iphone" | "mac",
) {
  try {
    const stats = fs.statSync(filePath);
    const birthTime = stats.birthtime;
    const birthString = birthTime.toISOString();
    const newPath = path.join(
      rootDir,
      "legacy_data",
      `${birthString}_${device}_usage.json`,
    );

    fs.renameSync(filePath, newPath);
  } catch (error) {
    console.error(`Error handling ${device} usage file:`, error);
  }
}

async function retrieveData() {
  const SCRIPT_PATH = process.argv[1];
  const API_ROOT_DIRECTORY = path.resolve(SCRIPT_PATH, "..", "..", "..");
  const IPHONE_USAGE_FILENAME = "iphone_usage.json";
  const MAC_USAGE_FILENAME = "mac_usage.json";

  const IPHONE_USAGE_PATH = path.join(
    API_ROOT_DIRECTORY,
    IPHONE_USAGE_FILENAME,
  );

  if (fs.existsSync(IPHONE_USAGE_PATH)) {
    relocateFile(API_ROOT_DIRECTORY, IPHONE_USAGE_PATH, "iphone");
  }

  const MAC_USAGE_PATH = path.join(API_ROOT_DIRECTORY, MAC_USAGE_FILENAME);

  if (fs.existsSync(MAC_USAGE_PATH)) {
    relocateFile(API_ROOT_DIRECTORY, MAC_USAGE_PATH, "mac");
  }

  const AW_IMPORT_SCREENTIME_PATH = process.env.AW_IMPORT_SCREENTIME_PATH;
  const HOME_PATH = process.env.HOME_PATH;

  try {
    await execAsync(`source ${AW_IMPORT_SCREENTIME_PATH}/.venv/bin/activate`);
    await execAsync(
      `${AW_IMPORT_SCREENTIME_PATH}/.venv/bin/aw-import-screentime events preview > ${API_ROOT_DIRECTORY}/iphone_usage.json`,
    );
    await execAsync(`sqlite3 -readonly -json '${HOME_PATH}/Library/Application Support/Knowledge/knowledgeC.db' "
      SELECT *
      FROM ZOBJECT
      WHERE ZSTREAMNAME = '/app/usage'
      ORDER BY ZSTARTDATE;
    " > ${API_ROOT_DIRECTORY}/mac_usage.json`);
  } catch (error) {
    console.error("Error reading databases:", error);
  }
}

export default retrieveData;
