import { app } from "electron"
import { getDevSessionDataPath, getDevUserDataPath } from "./devRuntime"

if (!app.isPackaged) {
  const userDataPath = getDevUserDataPath()
  app.setPath("userData", userDataPath)

  try {
    app.setPath("sessionData", getDevSessionDataPath())
  } catch {
    // Older Electron versions may not expose sessionData.
  }

  console.log(`[Main] Dev userData path: ${userDataPath}`)
}
