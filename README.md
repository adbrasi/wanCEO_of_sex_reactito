# AI Video Generator App

A Next.js application for generating AI-powered videos using ComfyUI workflows through Modal API.

## Features

- Upload images and generate animated videos
- Customizable prompts and parameters
- Batch processing support (generate multiple videos at once)
- Resolution options: 768x768 or 1024x1024
- Adjustable frame count
- Visual history gallery with today/yesterday sections
- Video player with fullscreen mode
- Download generated videos
- Progress tracking
- Random seed generation for variations

## Quick Start

### Development
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
npm run start
```

## Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Deploy with default settings

Or use Vercel CLI:
```bash
npm i -g vercel
vercel
```

## How to Use

1. **Upload Image**: Click the upload area and select an image
2. **Enter Prompt**: Describe the animation you want
3. **Adjust Settings**:
   - Resolution: Choose between 768x768 or 1024x1024
   - Frames: Set the number of animation frames
   - Batch Size: Generate multiple variations at once
4. **Generate**: Click the generate button
5. **View Results**: Videos appear in the history gallery below

## API Configuration

The app uses the ComfyUI API at:
```
https://cezarsaint--comfyui-saas-api-api.modal.run
```

No authentication required.

## Tech Stack

- Next.js 15 with Turbopack
- React 19
- TypeScript
- Tailwind CSS
- ComfyUI workflow integration

## Notes

- Videos are stored in browser localStorage
- History shows today and yesterday's generations
- Each batch request uses a random seed for variations
- Progress is tracked in real-time during generation