// electron/main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;

// Initialize Prisma with correct database path
let prisma = null;

async function initializePrisma() {
  try {
    // Get the correct database path
    const dbPath = isDev
      ? path.join(process.cwd(), "database", "doorstore.sqlite")
      : path.join(app.getPath("userData"), "doorstore.sqlite");

    // Ensure database directory exists
    await ensureDirectory(path.dirname(dbPath));

    // Set the DATABASE_URL environment variable to the correct path
    process.env.DATABASE_URL = `file:${dbPath}`;

    console.log("Database path:", dbPath);
    console.log("DATABASE_URL:", process.env.DATABASE_URL);

    // Import and initialize Prisma Client
    const { PrismaClient } = require("../src/generated/prisma/client");
    prisma = new PrismaClient();

    // Test the connection
    await prisma.$connect();
    console.log("Prisma connected successfully");

    return prisma;
  } catch (error) {
    console.error("Error initializing Prisma:", error);
    throw error;
  }
}

const isDev = process.env.NODE_ENV === "development";
let db = null;

// async function ensureDatabase() {
//   // file name used for DB
//   const DB_FILENAME = "doorstore.sqlite";

//   if (isDev) {
//     // dev: keep DB in project folder for easy access
//     const devDbPath = path.join(process.cwd(), "database", DB_FILENAME);
//     await ensureDirectory(path.dirname(devDbPath));
//     return devDbPath;
//   }

//   // production: store DB in userData so it persists across app updates
//   const userDataPath = app.getPath("userData");
//   const prodDbPath = path.join(userDataPath, DB_FILENAME);

//   // if DB already exists in userData, return it
//   if (fs.existsSync(prodDbPath)) {
//     return prodDbPath;
//   }

//   // Try to copy a bundled empty DB or run schema to create DB
//   // The schema.sql was included via extraResources to process.resourcesPath
//   const bundledSchema = path.join(process.resourcesPath, "schema.sql");
//   console.log("Looking for bundled schema at:", bundledSchema);

//   // Create userData folder if necessary
//   await ensureDirectory(path.dirname(prodDbPath));

//   if (fs.existsSync(bundledSchema)) {
//     console.log("Found bundled schema, initializing database...");
//     // Create new DB file and run schema SQL
//     const tmpDb = new Database(prodDbPath);
//     try {
//       const schemaSql = fs.readFileSync(bundledSchema, "utf8");
//       console.log("Schema SQL loaded, length:", schemaSql.length);
//       // run every statement separated by semicolon (simple approach)
//       const statements = schemaSql
//         .split(/;\s*$/m)
//         .map((s) => s.trim())
//         .filter(Boolean);
//       console.log("Found", statements.length, "SQL statements to execute");
//       tmpDb.transaction(() => {
//         statements.forEach((stmt, index) => {
//           console.log(
//             `Executing statement ${index + 1}:`,
//             stmt.substring(0, 50) + "..."
//           );
//           tmpDb.prepare(stmt).run();
//         });
//       })();
//       tmpDb.close();
//       console.log("Database initialized from bundled schema at", prodDbPath);
//       return prodDbPath;
//     } catch (err) {
//       console.error("Failed to initialize DB from schema:", err);
//       try {
//         tmpDb.close();
//       } catch (e) {}
//       throw err;
//     }
//   } else {
//     console.log("No bundled schema found at:", bundledSchema);
//     console.log("process.resourcesPath:", process.resourcesPath);
//     console.log("Available files in resourcesPath:");
//     try {
//       const files = fs.readdirSync(process.resourcesPath);
//       console.log(files);
//     } catch (e) {
//       console.log("Could not list files:", e.message);
//     }

//     // no schema bundled: just create empty DB (tables will be created on first run if your code handles it)
//     // create empty DB file
//     const tmpDb = new Database(prodDbPath);
//     tmpDb.close();
//     console.log("Created empty DB file at", prodDbPath);
//     return prodDbPath;
//   }
// }

function getDatabasePath() {
  if (app.isPackaged) {
    // packaged exe → db lives in resources/
    return path.join(process.resourcesPath, "sqlite.db");
  } else {
    // dev mode → use project root db
    return path.join(__dirname, "../sqlite.db");
  }
}

const dbPath = getDatabasePath();
process.env.DATABASE_URL = `file:${dbPath}`;

async function ensureDirectory(dir) {
  try {
    await fsp.mkdir(dir, { recursive: true });
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }
}

// async function initDbConnection() {
//   try {
//     const dbPath = await ensureDatabase();
//     db = new Database(dbPath);
//     // Optional: enforce foreign keys
//     try {
//       db.pragma("foreign_keys = ON");
//     } catch (e) {}
//     console.log("Opened database at", dbPath);

//     // Always ensure schema is up to date (both dev and production)
//     await ensureSchema();

//     // Check and migrate existing data if needed
//     await migrateDatabase();
//   } catch (err) {
//     console.error("initDbConnection error:", err);
//     throw err;
//   }
// }

// Function to ensure schema is always applied
// async function ensureSchema() {
//   try {
//     let schemaFile;

//     if (isDev) {
//       // Development: use schema.sql from project folder
//       schemaFile = path.join(process.cwd(), "database", "schema.sql");
//     } else {
//       // Production: use schema.sql from app resources
//       schemaFile = path.join(__dirname, "..", "database", "schema.sql");

//       // Fallback: try different paths for production
//       if (!fs.existsSync(schemaFile)) {
//         schemaFile = path.join(process.resourcesPath, "database", "schema.sql");
//       }
//       if (!fs.existsSync(schemaFile)) {
//         schemaFile = path.join(__dirname, "database", "schema.sql");
//       }
//     }

//     if (fs.existsSync(schemaFile)) {
//       const schemaSql = fs.readFileSync(schemaFile, "utf8");

//       // Better SQL parsing: remove comments and split by semicolons
//       const statements = schemaSql
//         .split("\n")
//         .filter((line) => !line.trim().startsWith("--")) // Remove comment lines
//         .join("\n")
//         .split(";")
//         .map((stmt) => stmt.trim())
//         .filter((stmt) => stmt && stmt.length > 0); // Remove empty statements

//       db.transaction(() => {
//         statements.forEach((stmt) => {
//           if (stmt && stmt.trim()) {
//             console.log("Executing SQL:", stmt.substring(0, 50) + "...");
//             db.prepare(stmt).run();
//           }
//         });
//       })();

//       console.log("Schema applied successfully from", schemaFile);
//     } else {
//       console.warn("Schema file not found at:", schemaFile);
//     }
//   } catch (error) {
//     console.error("Error applying schema:", error);
//     throw error;
//   }
// }

// Function to migrate existing database to add missing columns
// async function migrateDatabase() {
//   try {
//     // Check if image_path column exists in products table
//     const tableInfo = db.prepare("PRAGMA table_info(products)").all();
//     const hasImagePath = tableInfo.some(
//       (column) => column.name === "image_path"
//     );

//     if (!hasImagePath) {
//       db.prepare("ALTER TABLE products ADD COLUMN image_path TEXT").run();
//     }

//     // Check for other potential missing columns
//     const hasCreatedAt = tableInfo.some(
//       (column) => column.name === "created_at"
//     );
//     const hasUpdatedAt = tableInfo.some(
//       (column) => column.name === "updated_at"
//     );

//     if (!hasCreatedAt) {
//       console.log("Adding created_at column to products table...");
//       db.prepare(
//         "ALTER TABLE products ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
//       ).run();
//     }

//     if (!hasUpdatedAt) {
//       console.log("Adding updated_at column to products table...");
//       db.prepare(
//         "ALTER TABLE products ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP"
//       ).run();
//     }
//   } catch (error) {
//     console.error("Migration error:", error);
//     // Don't throw here - migrations might fail if columns already exist
//   }
// }

// --- IPC handlers (use db variable)
function registerIpcHandlers() {
  ipcMain.handle(
    "add-product",
    async (event, { name, price, stock, image_path }) => {
      if (!prisma) throw new Error("Prisma not initialized");

      console.log("Adding product:", { name, price, stock, image_path });

      try {
        const product = await prisma.product.create({
          data: {
            name,
            price,
            stock,
            image_path: image_path || null,
          },
        });

        console.log("Product added with ID:", product.id);

        return { success: true, id: product.id };
      } catch (error) {
        console.error("Failed to add product:", error);
        return { success: false, error: String(error) };
      }
    }
  );

  ipcMain.handle("get-products", async () => {
    if (!prisma) throw new Error("Prisma not initialized");

    const products = await prisma.product.findMany();
    // if (!db) throw new Error("Database not initialized");

    // // Check table structure for debugging
    // const tableInfo = db.prepare("PRAGMA table_info(products)").all();
    // // console.log("Products table structure:", tableInfo);

    // const products = db.prepare("SELECT * FROM products").all();
    console.log("Retrieved products from database:", products);
    return products;
  });

  ipcMain.handle("delete-product", async (event, id) => {
    // if (!db) throw new Error("Database not initialized");
    // const stmt = db.prepare("DELETE FROM products WHERE id = ?");
    // const info = stmt.run(id);
    await prisma.product.delete({
      where: {
        id,
      },
    });
    return { success: true, messages: "Deleted product successfully" };
  });

  // Image upload handler
  ipcMain.handle("upload-image", async (event, imageData) => {
    try {
      console.log("Upload-image handler called with:", {
        name: imageData.name,
        bufferSize: imageData.buffer ? imageData.buffer.length : "no buffer",
      });

      const { app } = require("electron");
      const crypto = require("crypto");

      // Create images directory in userData
      const userDataPath = app.getPath("userData");
      const imagesDir = path.join(userDataPath, "images");

      // Ensure images directory exists
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
        console.log("Created images directory:", imagesDir);
      }

      // Generate unique filename
      const fileExtension = imageData.name.split(".").pop();
      const uniqueName = `${crypto.randomUUID()}.${fileExtension}`;
      const imagePath = path.join(imagesDir, uniqueName);

      // Write image file
      fs.writeFileSync(imagePath, imageData.buffer);

      console.log("Image saved to:", imagePath);
      return { success: true, path: imagePath, filename: uniqueName };
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  });

  // Get image handler (for serving images to frontend)
  ipcMain.handle("get-image", async (event, imagePath) => {
    try {
      if (!imagePath || !fs.existsSync(imagePath)) {
        return null;
      }

      const imageBuffer = fs.readFileSync(imagePath);
      const base64 = imageBuffer.toString("base64");
      const mimeType = getMimeType(imagePath);

      return {
        data: `data:${mimeType};base64,${base64}`,
        exists: true,
      };
    } catch (error) {
      console.error("Error reading image:", error);
      return null;
    }
  });

  // add other handlers you need...

  // Debug handler to check database schema
  // ipcMain.handle("debug-database", async () => {
  //   if (!db) throw new Error("Database not initialized");

  //   const tableInfo = db.prepare("PRAGMA table_info(products)").all();
  //   const products = db.prepare("SELECT * FROM products").all();

  //   return {
  //     tableStructure: tableInfo,
  //     products: products,
  //     hasImagePathColumn: tableInfo.some((col) => col.name === "image_path"),
  //   };
  // });
}

// Helper function to get MIME type
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
  };
  return mimeTypes[ext] || "image/jpeg";
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
    await initializePrisma();
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

app.on("before-quit", async () => {
  try {
    if (prisma) {
      await prisma.$disconnect();
      console.log("Prisma disconnected");
    }
  } catch (e) {
    console.error("Error disconnecting Prisma:", e);
  }
});
