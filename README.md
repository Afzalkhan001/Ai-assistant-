# AI Personal Assistant

A human-like AI accountability companion with emotional intelligence, multi-tone modes, and memory-aware responses.

## Features

- 🧠 **GPT-4o mini** powered conversations
- 🎭 **4 Tone Modes**: Soft, Balanced, Strict Clean, Strict Raw
- 🌊 **Liquid Glass Design** - Premium dark theme UI
- 💬 **Context-Aware** - Remembers conversation history
- 🛡️ **Crisis Detection** - Auto-responds to crisis signals
- ✅ **Response Validation** - Filters AI clichés and enforces brevity

## Tech Stack

### Backend
- FastAPI (Python)
- OpenAI API (GPT-4o mini)
- Supabase (Database)

### Frontend
- React + Vite
- TypeScript
- TailwindCSS
- React Router

## Setup

### 1. Backend Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

Create `backend/.env.local`:
```env
OPENAI_API_KEY=sk-your-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
```

Run backend:
```bash
python main.py
```

Backend runs at: http://localhost:8000

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

## Tone Modes

- **🌸 Soft**: Gentle, empathetic, no pressure
- **⚖️ Balanced**: Direct but caring (default)
- **💪 Strict Clean**: Factual accountability, no profanity
- **🔥 Strict Raw**: Blunt + explicit language (opt-in)

## Project Structure

```
ai personal app/
├── backend/
│   ├── main.py           # FastAPI app with tone modes
│   ├── requirements.txt
│   └── .env.local        # API keys (NOT in git)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx
│   │   ├── screens/
│   │   │   ├── ChatScreen.tsx
│   │   │   ├── CheckinScreen.tsx
│   │   │   ├── TasksScreen.tsx
│   │   │   ├── ReflectionsScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   └── index.css
│   └── package.json
└── .gitignore
```

## Key Features

### Human-Like Responses
- 1-3 sentence maximum (enforced)
- No AI clichés or corporate speak
- Memory-based specificity
- Emotional matching, not leading

### Safety Features
- Crisis keyword detection
- Banned phrase filtering
- Response validation with retry
- Automatic downgrade from strict modes

## Development

- Backend auto-reloads on file changes
- Frontend has hot module replacement
- Use the tone selector in chat header to test modes

## License

MIT
