# 🚪 Door Store App

A modern desktop application template built with **Next.js**, **Electron**, and **SQLite**. This project demonstrates how to create a full-stack desktop application with a beautiful UI, local database storage, and cross-platform compatibility.

![Door Store App Screenshot](https://via.placeholder.com/800x500?text=Door+Store+App+Screenshot)

## 🌟 Features

- ✅ **Modern Frontend**: Next.js 15 with React 19 and TypeScript
- ✅ **Desktop App**: Electron for cross-platform desktop deployment
- ✅ **Local Database**: SQLite with better-sqlite3 for fast, embedded database
- ✅ **Real-time CRUD**: Add, view, and delete products with instant UI updates
- ✅ **Beautiful UI**: Tailwind CSS for responsive and modern design
- ✅ **Type Safety**: Full TypeScript support throughout the application
- ✅ **IPC Communication**: Secure communication between renderer and main process
- ✅ **Development Tools**: Hot reload, debugging, and development server
- ✅ **Build System**: Ready for production packaging with electron-builder

## 🛠️ Tech Stack

### Frontend

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework

### Desktop

- **[Electron](https://www.electronjs.org/)** - Desktop app framework
- **[electron-builder](https://www.electron.build/)** - Application packaging
- **[electron-rebuild](https://github.com/electron/electron-rebuild)** - Native module rebuilding

### Database

- **[SQLite](https://www.sqlite.org/)** - Embedded database
- **[better-sqlite3](https://github.com/WiseLibs/better-sqlite3)** - Fast SQLite3 bindings

### Development

- **[Concurrently](https://github.com/open-cli-tools/concurrently)** - Run multiple commands
- **[wait-on](https://github.com/jeffbski/wait-on)** - Wait for resources
- **[ESLint](https://eslint.org/)** - Code linting

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/door-store-app.git
   cd door-store-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Rebuild native modules for Electron**

   ```bash
   npm run rebuild
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

This will start both the Next.js development server and the Electron app simultaneously.

## 📁 Project Structure

```
door-store-app/
├── src/
│   └── app/
│       ├── page.tsx          # Main product management page
│       ├── layout.tsx        # App layout
│       └── globals.css       # Global styles
├── electron/
│   ├── main.js              # Electron main process
│   └── preload.js           # Preload script for IPC
├── database/
│   └── db.js                # SQLite database setup
├── types/
│   └── electron.d.ts        # TypeScript definitions
├── package.json             # Dependencies and scripts
├── next.config.ts           # Next.js configuration
├── tsconfig.json           # TypeScript configuration
└── tailwind.config.js      # Tailwind CSS configuration
```

## 📋 Available Scripts

| Command                | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | Start development (Next.js + Electron)         |
| `npm run dev:next`     | Start only Next.js development server          |
| `npm run dev:electron` | Start only Electron (requires Next.js running) |
| `npm run build:next`   | Build Next.js for production                   |
| `npm run rebuild`      | Rebuild native modules for Electron            |
| `npm run dist`         | Build and package for distribution             |

## 🔧 Development Guide

### IPC Communication

The app uses Electron's IPC (Inter-Process Communication) for secure communication between the frontend and backend:

```typescript
// Add product
await window.electronAPI.addProduct({
  name: "Wooden Door",
  price: 15000,
  stock: 5,
});

// Get all products
const products = await window.electronAPI.getProducts();

// Delete product
await window.electronAPI.deleteProduct(productId);
```

### Database Schema

The SQLite database contains a `products` table:

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  stock INTEGER DEFAULT 0
);
```

### Adding New Features

1. **Backend (Electron Main Process)**

   - Add IPC handlers in `electron/main.js`
   - Add database operations in `database/db.js`

2. **Preload Script**

   - Expose new functions in `electron/preload.js`

3. **Type Definitions**

   - Update interfaces in `types/electron.d.ts`

4. **Frontend (React)**
   - Use the new functions in your React components

## 🏗️ Building for Production

### Development Build

```bash
npm run build:next
```

### Create Distributables

```bash
npm run dist
```

This creates installers in the `dist/` folder for your current platform.

### Cross-Platform Building

Configure additional platforms in `package.json`:

```json
{
  "build": {
    "win": {
      "target": ["nsis", "portable"]
    },
    "mac": {
      "target": ["dmg", "zip"]
    },
    "linux": {
      "target": ["AppImage", "deb"]
    }
  }
}
```

## 🎨 Customization

### Styling

- Modify `src/app/globals.css` for global styles
- Update `tailwind.config.js` for Tailwind customization
- Edit components in `src/app/page.tsx` for UI changes

### Database

- Modify `database/db.js` to add new tables or change schema
- Add corresponding TypeScript interfaces in `types/electron.d.ts`

### Electron Configuration

- Update `electron/main.js` for window settings, menu, etc.
- Modify `electron/preload.js` for new IPC communications

## 🐛 Common Issues & Solutions

### Native Module Issues

If you encounter native module errors:

```bash
npm run rebuild
```

### Port Already in Use

If port 3000 is busy, modify the port in `package.json`:

```json
{
  "scripts": {
    "dev:next": "next dev -p 3001"
  }
}
```

### TypeScript Errors

Ensure all type definitions are up to date in `types/electron.d.ts`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Electron](https://www.electronjs.org/) team for the amazing desktop framework
- [Next.js](https://nextjs.org/) team for the excellent React framework
- [SQLite](https://www.sqlite.org/) for the lightweight database
- [Tailwind CSS](https://tailwindcss.com/) for the beautiful styling system

## 📞 Support

If you have any questions or need help, please:

- Open an issue on GitHub
- Check the [Electron documentation](https://www.electronjs.org/docs)
- Review the [Next.js documentation](https://nextjs.org/docs)

---

⭐ If this template helped you, please give it a star on GitHub!

## 🚀 Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/door-store-app)

> **Note**: This button is for the Next.js frontend only. For the full Electron app, clone and build locally.
