'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Bot, Loader2, Sparkles, ArrowLeft, Mic, MicOff } from 'lucide-react';
import { INITIAL_ASSISTANT_MESSAGE } from '@/lib/ai-prompts';
import { useStore } from '@/lib/store';
import { ChatMessage } from './ui/chat-message';

// Types for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

type Role = 'user' | 'assistant';

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp?: Date;
  isStreaming?: boolean;
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
    { id: 'initial', role: 'assistant', content: INITIAL_ASSISTANT_MESSAGE, timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastToolInfo, setLastToolInfo] = useState<{ calls?: string[]; results?: 'executed' | 'none' } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, lastToolInfo]);

  // Initialize speech recognition on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.continuous = true; // Continue jusqu'à ce que l'utilisateur arrête
        recognition.interimResults = true; // Affiche les résultats en temps réel
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            }
          }

          if (finalTranscript) {
            setInput((prev) => {
              const trimmedPrev = prev.trim();
              return trimmedPrev ? trimmedPrev + ' ' + finalTranscript.trim() : finalTranscript.trim();
            });
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          // Ne s'arrête que pour les erreurs graves
          if (event.error === 'no-speech' || event.error === 'aborted') {
            // Erreurs normales, on continue
            return;
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          // Si l'utilisateur est toujours en mode écoute, on redémarre
          // (certains navigateurs arrêtent après un certain temps)
          if (isListening) {
            try {
              recognition.start();
            } catch {
              setIsListening(false);
            }
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore errors when stopping recognition on unmount
        }
      }
    };
  }, [isListening]);

  // Helpers
  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  // Simulate streaming effect for better UX
  const streamMessage = (fullContent: string, timestamp: Date) => {
    // Clear any existing stream first
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }

    // For very short messages, show immediately
    if (fullContent.length < 50) {
      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: 'assistant', content: fullContent, timestamp, isStreaming: false },
      ]);
      return;
    }

    const charsPerChunk = 15; // Stream 15 characters at a time
    let currentIndex = 0;

    // Add empty assistant message
    setMessages((prev) => [
      ...prev,
      { id: `assistant-${Date.now()}`, role: 'assistant', content: '', timestamp, isStreaming: true },
    ]);

    streamIntervalRef.current = setInterval(() => {
      if (currentIndex >= fullContent.length) {
        // Streaming complete
        if (streamIntervalRef.current) {
          clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        }
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            return [
              ...updated.slice(0, lastIdx),
              { ...updated[lastIdx], isStreaming: false },
            ];
          }
          return updated;
        });
        return;
      }

      // Add next chunk of characters (preserving everything including line breaks)
      const nextChunk = fullContent.substring(currentIndex, currentIndex + charsPerChunk);
      currentIndex += charsPerChunk;

      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
          const lastMsg = updated[lastIdx];
          return [
            ...updated.slice(0, lastIdx),
            {
              ...lastMsg,
              content: lastMsg.content + nextChunk,
            },
          ];
        }
        return updated;
      });
    }, 30); // 30ms between chunks for smooth streaming
  };

  // Cleanup streaming on unmount
  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, []);

  // Speech recognition handlers
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

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

    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: input.trim(), timestamp: new Date() };
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
      const content = finalOk.message || "Désolé, je n'ai pas pu traiter votre demande.";
      const timestamp = new Date();
      
      // Use streaming effect for assistant response
      streamMessage(content, timestamp);
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
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `❌ ${finalErr.error}${details}`,
          timestamp: new Date(),
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

      <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4 bg-white">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
            isStreaming={message.isStreaming}
          />
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

        {/* Indicateur d'enregistrement vocal */}
        {isListening && (
          <div className="flex items-center justify-between px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-red-600 rounded animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-4 bg-red-600 rounded animate-pulse" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-4 bg-red-600 rounded animate-pulse" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-sm text-red-700 font-medium">Écoute en cours...</span>
            </div>
            <span className="text-xs text-red-600">Cliquez sur 🎤 pour arrêter</span>
          </div>
        )}

        {/* Zone de saisie */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Parlez maintenant..." : "Posez une question..."}
            disabled={isLoading}
            className="flex-1 h-12 text-base"
          />
          {/* Bouton micro pour speech-to-text */}
          {speechSupported && (
            <Button
              type="button"
              variant={isListening ? 'default' : 'outline'}
              onClick={toggleListening}
              disabled={isLoading}
              className={`h-12 min-w-[48px] px-3 transition-all ${
                isListening 
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                  : ''
              }`}
              title={isListening ? 'Arrêter l\'enregistrement' : 'Activer la saisie vocale'}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>
          )}
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
