const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const isDev = process.env.NODE_ENV !== "production";

let serverProcess = null;
let db = null;

// Initialize database
try {
  db = require("../database/db");
  console.log("Database loaded successfully");
} catch (error) {
  console.error("Failed to load database:", error);
}

// 📌 Register IPC handlers before app is ready
console.log("Registering IPC handlers...");

ipcMain.handle("add-product", async (event, { name, price, stock }) => {
  try {
    console.log("IPC: Adding product:", { name, price, stock });
    if (!db) {
      throw new Error("Database not initialized");
    }
    const stmt = db.prepare(
      "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)"
    );
    const info = stmt.run(name, price, stock);
    console.log("IPC: Product added successfully:", info);
    return { success: true, id: info.lastInsertRowid };
  } catch (error) {
    console.error("IPC: Error adding product:", error);
    throw error;
  }
});

ipcMain.handle("get-products", async () => {
  try {
    console.log("IPC: Getting products...");
    if (!db) {
      throw new Error("Database not initialized");
    }
    const products = db.prepare("SELECT * FROM products").all();
    console.log("IPC: Products retrieved:", products);
    return products;
  } catch (error) {
    console.error("IPC: Error getting products:", error);
    throw error;
  }
});

ipcMain.handle("delete-product", async (event, id) => {
  try {
    console.log("IPC: Deleting product with ID:", id);
    if (!db) {
      throw new Error("Database not initialized");
    }
    const stmt = db.prepare("DELETE FROM products WHERE id = ?");
    const info = stmt.run(id);
    console.log("IPC: Product deleted successfully:", info);
    return { success: true, changes: info.changes };
  } catch (error) {
    console.error("IPC: Error deleting product:", error);
    throw error;
  }
});

console.log("IPC handlers registered successfully");

function startNextProd() {
  const cmd = process.platform === "win32" ? "npm.cmd" : "npm";
  serverProcess = spawn(cmd, ["run", "start:next"], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, NODE_ENV: "production" },
    stdio: "inherit",
  });
  serverProcess.on("exit", (code) => console.log("Next process exited", code));
}

function createWindow() {
  console.log("Creating window...");
  const preloadPath = path.join(__dirname, "preload.js");
  console.log("Preload script path:", preloadPath);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const url = isDev ? "http://localhost:3000" : "http://localhost:3000";
  console.log("Loading URL:", url);

  win.loadURL(url);

  // Open DevTools in development
  if (isDev) {
    win.webContents.openDevTools();
  }

  // Log when the window is ready
  win.webContents.once("dom-ready", () => {
    console.log("Window DOM ready");
  });
}

app.whenReady().then(() => {
  if (!isDev) startNextProd();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => {
  if (serverProcess) serverProcess.kill();
});
