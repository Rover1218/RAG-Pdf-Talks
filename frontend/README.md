# Next.js Frontend for RAG PDF Chatbot

A modern, responsive Next.js frontend for the RAG PDF Chatbot application.

## Features

- 📄 PDF document upload with drag-and-drop support
- 💬 Real-time chat interface with AI responses
- 📚 Document management (list, select, delete)
- 🎨 Modern UI with Tailwind CSS
- 📱 Fully responsive design
- ⚡ Built with Next.js 15 and React 19

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Create .env.local file with:
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Running the Development Server

```bash
npm run dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
