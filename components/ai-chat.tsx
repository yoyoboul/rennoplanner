'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Bot, User, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { INITIAL_ASSISTANT_MESSAGE } from '@/lib/ai-prompts';
import { useStore } from '@/lib/store';

type Role = 'user' | 'assistant';

interface Message {
  role: Role;
  content: string;
}

interface ServerResponseOk {
  message: string;
  tool_calls?: string[];
  tool_results?: 'executed' | 'none';
}

interface ServerResponseErr {
  error: string;
  code?: string;
  details?: unknown;
}

interface AIChatProps {
  projectId: number | string;
  onBack?: () => void;
}

export function AIChat({ projectId, onBack }: AIChatProps) {
  const { fetchProject, fetchPurchases } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: INITIAL_ASSISTANT_MESSAGE },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastToolInfo, setLastToolInfo] = useState<{ calls?: string[]; results?: 'executed' | 'none' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, lastToolInfo]);

  // Helpers
  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  async function parseJsonSafe(res: Response) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  async function sendMessage() {
    if (!canSend) return;

    // Annule une requête en cours si l’utilisateur spam le bouton
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);
    setLastToolInfo(null);

    // Retry (réseau uniquement): 2 tentatives avec backoff
    const maxAttempts = 2;
    let attempt = 0;
    let finalOk: ServerResponseOk | null = null;
    let finalErr: ServerResponseErr | null = null;

    while (attempt < maxAttempts && !finalOk) {
      attempt += 1;
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: nextMessages, project_id: projectId }),
          signal: controller.signal,
        });

        const payload = await parseJsonSafe(res);

        if (!res.ok) {
          // Erreurs “logiques” : 4xx/5xx -> pas de retry supplémentaire
          finalErr = {
            error:
              payload?.error ||
              payload?.message ||
              `${res.status} ${res.statusText}`,
            code: payload?.code,
            details: payload?.details,
          };
          break;
        }

        // Succès
        finalOk = payload as ServerResponseOk;
      } catch (err: unknown) {
        const error = err as { name?: string; message?: string };
        // Abort -> on sort proprement
        if (error?.name === 'AbortError') {
          finalErr = { error: 'Requête annulée.' };
          break;
        }
        // Erreur réseau: on retente (sauf dernière tentative)
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 400 * attempt));
          continue;
        }
        finalErr = { error: 'Erreur réseau. Vérifiez votre connexion.' };
      }
    }

    if (finalOk) {
      const assistantMessage: Message = {
        role: 'assistant',
        content: finalOk.message || 'Désolé, je n’ai pas pu traiter votre demande.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setLastToolInfo({ calls: finalOk.tool_calls, results: finalOk.tool_results });

      // Rafraîchis les données liées au projet (sans bloquer l'UX)
      Promise.allSettled([
        fetchProject(projectId as number),
        fetchPurchases(projectId as number),
      ]).catch(() => {});
    } else if (finalErr) {
      console.error('AIChat error:', finalErr);
      const details =
        finalErr.code === 'RATE_LIMIT'
          ? " (limite de requêtes atteinte — réessayez plus tard)"
          : '';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ ${finalErr.error}${details}`,
        },
      ]);
    }

    setIsLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Entrée = envoyer ; Shift+Entrée (rare sur input) ignoré
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <Card className="flex flex-col fixed inset-0 sm:relative sm:h-[600px] z-50 sm:z-auto rounded-none sm:rounded-lg overflow-hidden">
      <CardHeader className="border-b py-3 sm:py-4 bg-white sm:bg-transparent flex-shrink-0 safe-area-top">
        <div className="flex items-center gap-3">
          {/* Bouton retour (mobile uniquement) */}
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="sm:hidden h-10 w-10 p-0 flex-shrink-0"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
          )}
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Bot className="w-6 h-6 sm:w-5 sm:h-5 text-blue-600" />
            Assistant IA
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-white">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-2 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2.5 sm:px-4 sm:py-2 ${
                message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="text-base sm:text-sm prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="mb-1 leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ children }) => (
                      <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm">{children}</code>
                    ),
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 sm:w-8 sm:h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
              <span className="text-sm text-gray-600">Réflexion en cours…</span>
            </div>
          </div>
        )}

        {/* Badge outils si dispo */}
        {!isLoading && lastToolInfo?.calls && lastToolInfo.calls.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Sparkles className="w-3 h-3" />
            <span>
              Outils utilisés&nbsp;: {lastToolInfo.calls.join(', ')}{' '}
              {lastToolInfo.results === 'executed' ? '✓' : ''}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      <div className="border-t p-3 sm:p-4 space-y-3 bg-white flex-shrink-0 safe-area-bottom">
        {/* Suggestions rapides (uniquement tout début) */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2">
            {[
              { icon: '📝', text: 'Ajoute une tâche' },
              { icon: '💰', text: 'Quel est mon budget ?' },
              { icon: '🛒', text: 'Génère ma liste de courses' },
              { icon: '📊', text: 'Analyse mon projet' },
            ].map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s.text)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg text-sm sm:text-xs flex items-center gap-2 transition-colors min-h-[44px]"
              >
                <span className="text-base">{s.icon}</span>
                <span>{s.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* Zone de saisie */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez une question..."
            disabled={isLoading}
            className="flex-1 h-12 text-base"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!canSend} 
            className="gap-2 h-12 min-w-[48px] px-3 sm:px-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            <span className="hidden sm:inline">{isLoading ? 'Envoi…' : 'Envoyer'}</span>
          </Button>
          {isLoading && (
            <Button
              type="button"
              variant="outline"
              onClick={() => abortRef.current?.abort()}
              className="text-sm h-12 hidden sm:flex"
            >
              Annuler
            </Button>
          )}
        </div>

        {/* Info footer - réduite sur mobile */}
        <div className="hidden sm:flex items-start gap-2 text-xs text-gray-500">
          <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Propulsé par GPT-5</strong> • Outils, budget, achats et conseils intégrés.
          </p>
        </div>
      </div>
    </Card>
  );
}
