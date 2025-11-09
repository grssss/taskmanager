# Task Manager Kanban

A personal kanban board application with drag & drop functionality, built with Next.js, Supabase, and modern web technologies.

## Features

- 📋 Kanban board with drag-and-drop cards
- 🎨 Multiple project support with custom colors
- 🌓 Dark mode / Light mode toggle
- 🔐 User authentication via Supabase
- 💾 Real-time cloud sync across devices
- 📱 Responsive design
- ⚡ Fast and modern UI

## Tech Stack

- **Framework**: Next.js 16 (React 19)
- **Database & Auth**: Supabase
- **Styling**: Tailwind CSS
- **Drag & Drop**: @dnd-kit
- **UI Icons**: Lucide React
- **Type Safety**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project ([Sign up here](https://supabase.com))

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd taskmanager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Set up the database**

   Run the SQL schema in your Supabase project:
   - Open Supabase Dashboard → SQL Editor
   - Copy contents of `supabase-schema.sql`
   - Execute the SQL

   See [SETUP_AUTH.md](./SETUP_AUTH.md) for detailed authentication setup.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment

### Deploy to Vercel (Recommended)

The easiest way to deploy this Next.js app is on Vercel:

**📖 [Read the Complete Deployment Guide](./DEPLOYMENT.md)**

Quick steps:
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add your Supabase environment variables
4. Click Deploy!

Your app will be live in minutes at `https://your-app-name.vercel.app`

### Other Deployment Options

- **Netlify**: Similar to Vercel, supports Next.js
- **Self-hosted**: Use `npm run build && npm start`
- **Docker**: Build a container with the Next.js standalone output

## Project Structure

```
taskmanager/
├── app/                  # Next.js app directory
│   ├── api/             # API routes
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/          # React components
├── lib/                 # Utilities and helpers
│   ├── supabase.ts     # Supabase client
│   └── types.ts        # TypeScript types
├── public/             # Static assets
└── supabase-schema.sql # Database schema

```

## Documentation

- [Authentication Setup Guide](./SETUP_AUTH.md) - How to configure Supabase auth
- [Deployment Guide](./DEPLOYMENT.md) - Step-by-step Vercel deployment

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## License

This project is open source and available under the MIT License.
