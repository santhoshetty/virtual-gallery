# Mom's Virtual Art Gallery

A 3D virtual art gallery built with Three.js, featuring immersive navigation and interactive paintings.

## Features

- 3D gallery environment with multiple rooms and corridors
- First-person navigation using pointer lock controls (WASD + mouse)
- Interactive paintings with detailed information panels
- Atmospheric lighting and shadows
- Background music and ambient audio
- Responsive design

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## Deployment

### Deploy to Vercel

1. Push your code to a Git repository
2. Import the project in Vercel
3. Vercel will automatically detect the configuration and deploy

Or deploy directly from the command line:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Configuration

The project includes:
- `vercel.json` - Vercel deployment configuration
- `vite.config.js` - Vite build configuration
- Static assets are properly configured for production deployment

## Controls

- **WASD** - Move around the gallery
- **Mouse** - Look around
- **Mouse Wheel** - Zoom in/out
- **Click on paintings** - View detailed information and larger images

## Technology Stack

- Three.js - 3D graphics and rendering
- Vite - Build tool and development server
- HTML5/CSS3/JavaScript - Core web technologies