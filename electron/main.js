// electron/main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const Database = require("better-sqlite3");

const isDev = process.env.NODE_ENV === "development";
let db = null;

async function ensureDatabase() {
  // file name used for DB
  const DB_FILENAME = "doorstore.sqlite";

  if (isDev) {
    // dev: keep DB in project folder for easy access
    const devDbPath = path.join(process.cwd(), "database", DB_FILENAME);
    await ensureDirectory(path.dirname(devDbPath));
    return devDbPath;
  }

  // production: store DB in userData so it persists across app updates
  const userDataPath = app.getPath("userData");
  const prodDbPath = path.join(userDataPath, DB_FILENAME);

  // if DB already exists in userData, return it
  if (fs.existsSync(prodDbPath)) {
    return prodDbPath;
  }

  // Try to copy a bundled empty DB or run schema to create DB
  // The schema.sql was included via extraResources to process.resourcesPath
  const bundledSchema = path.join(process.resourcesPath, "schema.sql");
  console.log("Looking for bundled schema at:", bundledSchema);

  // Create userData folder if necessary
  await ensureDirectory(path.dirname(prodDbPath));

  if (fs.existsSync(bundledSchema)) {
    console.log("Found bundled schema, initializing database...");
    // Create new DB file and run schema SQL
    const tmpDb = new Database(prodDbPath);
    try {
      const schemaSql = fs.readFileSync(bundledSchema, "utf8");
      console.log("Schema SQL loaded, length:", schemaSql.length);
      // run every statement separated by semicolon (simple approach)
      const statements = schemaSql
        .split(/;\s*$/m)
        .map((s) => s.trim())
        .filter(Boolean);
      console.log("Found", statements.length, "SQL statements to execute");
      tmpDb.transaction(() => {
        statements.forEach((stmt, index) => {
          console.log(
            `Executing statement ${index + 1}:`,
            stmt.substring(0, 50) + "..."
          );
          tmpDb.prepare(stmt).run();
        });
      })();
      tmpDb.close();
      console.log("Database initialized from bundled schema at", prodDbPath);
      return prodDbPath;
    } catch (err) {
      console.error("Failed to initialize DB from schema:", err);
      try {
        tmpDb.close();
      } catch (e) {}
      throw err;
    }
  } else {
    console.log("No bundled schema found at:", bundledSchema);
    console.log("process.resourcesPath:", process.resourcesPath);
    console.log("Available files in resourcesPath:");
    try {
      const files = fs.readdirSync(process.resourcesPath);
      console.log(files);
    } catch (e) {
      console.log("Could not list files:", e.message);
    }

    // no schema bundled: just create empty DB (tables will be created on first run if your code handles it)
    // create empty DB file
    const tmpDb = new Database(prodDbPath);
    tmpDb.close();
    console.log("Created empty DB file at", prodDbPath);
    return prodDbPath;
  }
}

async function ensureDirectory(dir) {
  try {
    await fsp.mkdir(dir, { recursive: true });
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }
}

async function initDbConnection() {
  try {
    const dbPath = await ensureDatabase();
    db = new Database(dbPath);
    // Optional: enforce foreign keys
    try {
      db.pragma("foreign_keys = ON");
    } catch (e) {}
    console.log("Opened database at", dbPath);

    // If you want to guarantee tables exist (double-check) run schema again in dev
    if (isDev) {
      const schemaFile = path.join(process.cwd(), "database", "schema.sql");
      if (fs.existsSync(schemaFile)) {
        const schemaSql = fs.readFileSync(schemaFile, "utf8");
        const statements = schemaSql
          .split(/;\s*$/m)
          .map((s) => s.trim())
          .filter(Boolean);
        db.transaction(() => {
          statements.forEach((stmt) => db.prepare(stmt).run());
        })();
        console.log("Ensured schema applied from", schemaFile);
      }
    }
  } catch (err) {
    console.error("initDbConnection error:", err);
    throw err;
  }
}

// --- IPC handlers (use db variable)
function registerIpcHandlers() {
  ipcMain.handle("add-product", async (event, { name, price, stock }) => {
    if (!db) throw new Error("Database not initialized");
    const stmt = db.prepare(
      "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)"
    );
    const info = stmt.run(name, price, stock);
    return { success: true, id: info.lastInsertRowid };
  });

  ipcMain.handle("get-products", async () => {
    if (!db) throw new Error("Database not initialized");
    return db.prepare("SELECT * FROM products").all();
  });

  ipcMain.handle("delete-product", async (event, id) => {
    if (!db) throw new Error("Database not initialized");
    const stmt = db.prepare("DELETE FROM products WHERE id = ?");
    const info = stmt.run(id);
    return { success: true, changes: info.changes };
  });

  // add other handlers you need...
}

// --- create window
function createWindow() {
  const preloadPath = path.join(__dirname, "preload.js");
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools();
  } else {
    // Production: load the static export from Next.js
    const indexPath = path.join(__dirname, "..", "out", "index.html");
    win.loadFile(indexPath);
  }

  win.webContents.once("dom-ready", () => {
    console.log("Window DOM ready");
  });
}

// --- app lifecycle
app.whenReady().then(async () => {
  try {
    await initDbConnection();
    registerIpcHandlers();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  } catch (err) {
    console.error("App init failed", err);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  try {
    if (db) db.close();
  } catch (e) {}
});
