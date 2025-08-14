const { contextBridge, ipcRenderer } = require("electron");

console.log("Preload script executing...");

try {
  contextBridge.exposeInMainWorld("electronAPI", {
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    on: (channel, cb) => ipcRenderer.on(channel, (_, ...args) => cb(...args)),
    addProduct: (product) => {
      console.log("Preload: addProduct called with:", product);
      return ipcRenderer.invoke("add-product", product);
    },
    getProducts: () => {
      console.log("Preload: getProducts called");
      return ipcRenderer.invoke("get-products");
    },
    deleteProduct: (id) => {
      console.log("Preload: deleteProduct called with ID:", id);
      return ipcRenderer.invoke("delete-product", id);
    },
    // Image operations
    uploadImage: (imageData) => {
      console.log("Preload: uploadImage called");
      return ipcRenderer.invoke("upload-image", imageData);
    },
    getImage: (imagePath) => {
      console.log("Preload: getImage called with path:", imagePath);
      return ipcRenderer.invoke("get-image", imagePath);
    },
    // Debug database
    debugDatabase: () => {
      console.log("Preload: debugDatabase called");
      return ipcRenderer.invoke("debug-database");
    },
  });

  console.log("electronAPI exposed successfully");
} catch (error) {
  console.error("Error in preload script:", error);
}
