'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL no está configurada");
}

type ActionResponse = {
  status: string;
  action: string;
  message: string;
};

export default function AdminPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runAction = async (endpoint: string, actionName: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/admin/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data: ActionResponse = await response.json();
      setMessage(`✅ ${data.action.toUpperCase()}: ${data.message}`);
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-green-400 p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Admin Panel
          </h1>
          <p className="text-sm text-green-300 mt-2">
            Ejecutar acciones del backend manualmente
          </p>
        </header>

        <div className="space-y-4">
          <button
            onClick={() => runAction('run-sync', 'sync')}
            disabled={isLoading}
            className="w-full bg-green-900 hover:bg-green-800 disabled:bg-gray-700 text-green-100 font-semibold py-3 px-6 rounded-lg border border-green-700 transition disabled:cursor-not-allowed"
          >
            {isLoading ? 'Ejecutando...' : 'Run Sync'}
          </button>

          <button
            onClick={() => runAction('run-scanner', 'scanner')}
            disabled={isLoading}
            className="w-full bg-green-900 hover:bg-green-800 disabled:bg-gray-700 text-green-100 font-semibold py-3 px-6 rounded-lg border border-green-700 transition disabled:cursor-not-allowed"
          >
            {isLoading ? 'Ejecutando...' : 'Run Scanner'}
          </button>

          <button
            onClick={() => runAction('run-pipeline', 'pipeline')}
            disabled={isLoading}
            className="w-full bg-green-900 hover:bg-green-800 disabled:bg-gray-700 text-green-100 font-semibold py-3 px-6 rounded-lg border border-green-700 transition disabled:cursor-not-allowed"
          >
            {isLoading ? 'Ejecutando...' : 'Run Pipeline'}
          </button>
        </div>

        {message && (
          <div className="mt-6 p-4 border border-green-700 rounded-lg bg-black/40">
            <p className="text-sm">{message}</p>
          </div>
        )}
      </div>
    </main>
  );
}