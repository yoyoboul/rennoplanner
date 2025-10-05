// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

import { availableTools, executeTool } from '@/lib/ai-tools';
import { chatMessageSchema } from '@/lib/validations-api';
import {
  withErrorHandling,
  ExternalServiceError,
  logInfo,
  logWarn,
  withRetry,
} from '@/lib/errors';
import { openaiRateLimiter, checkRateLimit } from '@/lib/rate-limiter';
import { buildProjectContext, buildRoomsContext } from '@/lib/ai-context';
import { SYSTEM_PROMPT, CONTEXT_PROMPT, ROOMS_PROMPT } from '@/lib/ai-prompts';
import { db } from '@/lib/db';

export const runtime = 'nodejs'; // ou 'edge' si vos libs sont compatibles

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------- Utilitaires locaux ----------

/**
 * Nettoie prudemment les "traces d'outils" que GPT-5 peut inclure.
 * On évite de supprimer du texte légitime ; on cible les patterns fréquents.
 */
function redactToolTraces(text: string | null | undefined): string {
  if (!text) {
    console.warn('⚠️ redactToolTraces received empty/null text');
    return '';
  }
  
  // Log pour debug
  const originalText = text;
  const originalLength = text.length;
  
  const cleaned = text
    // mentions de canaux internes
    .replace(/\bto=functions\.[\w-]+\b/gi, '')
    // IDs d'appels internes (ex: call_abc123) mais pas dans des phrases normales
    .replace(/\bcall_[A-Za-z0-9_-]{10,}\b/g, '')
    // snippets JSON "outil" trop verbeux - mais uniquement si ça ressemble vraiment à du JSON
    .replace(/\{\s*"name"\s*:\s*"[^"]+"\s*,\s*"arguments"\s*:\s*\{[^}]*\}\s*\}/g, '')
    .replace(/\{\s*"function"\s*:\s*\{[^}]*\}\s*\}/g, '')
    .replace(/\{\s*"type"\s*:\s*"function"[^}]*\}/g, '')
    // parenthèses explicatives parasites récurrentes
    .replace(/\([^)]*ajoute la tâche[^)]*\)/gi, '')
    // espaces multiples
    .replace(/\s+/g, ' ')
    .trim();
  
  // Si après nettoyage il ne reste rien ou presque rien (< 5 chars), 
  // retourner le texte original pour éviter de tout casser
  if (cleaned.length < 5 && originalLength > 5) {
    console.warn('⚠️ redactToolTraces removed too much content, keeping original', {
      originalLength,
      cleanedLength: cleaned.length,
      originalPreview: originalText.substring(0, 100),
    });
    return originalText.trim();
  }
  
  // Log si réduction significative
  if (originalLength > 100 && cleaned.length < originalLength * 0.8) {
    console.log('ℹ️ redactToolTraces reduced content by ' + Math.round((1 - cleaned.length / originalLength) * 100) + '%', {
      from: originalLength,
      to: cleaned.length,
    });
  }
  
  return cleaned;
}

/**
 * Construit le message système enrichi (projet + pièces/rooms).
 */
async function buildSystemMessage(projectId: string) {
  const projectContext = await buildProjectContext(projectId);
  const roomsContext = await buildRoomsContext(projectId);

  return {
    role: 'system' as const,
    content:
      SYSTEM_PROMPT +
      '\n\n' +
      CONTEXT_PROMPT(projectContext) +
      '\n\n' +
      ROOMS_PROMPT(roomsContext),
  };
}

/**
 * Exécute en parallèle les tool_calls retournés par le modèle
 * puis retourne la liste des messages "tool" à réinjecter.
 */
async function runToolCalls(
  toolCalls: Array<{
    id: string;
    function: { name: string; arguments: string };
    type: 'function';
  }>,
  projectId: number
) {
  const executions = await Promise.all(
    toolCalls.map(async (tc) => {
      const fnName = tc.function.name;
      const args = safeParseJson(tc.function.arguments);

      try {
        const result = await executeTool(fnName, args);
        logInfo('AI tool executed', {
          tool: fnName,
          projectId,
          args: Object.keys(args || {}),
        });

        return {
          tool_call_id: tc.id,
          role: 'tool' as const,
          name: fnName,
          content: JSON.stringify(result),
        };
      } catch (err: unknown) {
        const error = err as Error;
        logWarn('AI tool execution failed', {
          tool: fnName,
          error: error?.message,
          projectId,
        });

        return {
          tool_call_id: tc.id,
          role: 'tool' as const,
          name: fnName,
          content: JSON.stringify({
            success: false,
            error: error?.message || "Erreur lors de l'exécution",
          }),
        };
      }
    })
  );

  return executions;
}

function safeParseJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

/**
 * Sauvegarde le message assistant dans l'historique projet.
 */
function persistAssistantMessage(projectId: number, content: string) {
  try {
    db.prepare(
      `INSERT INTO chat_history (project_id, role, content) VALUES (?, ?, ?)`
    ).run(projectId, 'assistant', content);
  } catch {
    logWarn('Failed to save chat history', { projectId });
  }
}

// ---------- Boucle principale d’inférence ----------

/**
 * Lance un cycle complet de complétion:
 *  1) Appel modèle
 *  2) Exécution éventuelle des tools
 *  3) Reboucle jusqu’à 3 tours ou absence de tool_calls
 */
async function completeWithToolsLoop({
  systemMessage,
  userAndContextMessages,
  projectId,
  initialModel = 'gpt-5-mini',
  finalModel = 'gpt-5',
  maxToolRounds =30,
}: {
  systemMessage: { role: 'system'; content: string };
  userAndContextMessages: Array<{
    role: string;
    content: string;
    tool_call_id?: string;
    name?: string;
  }>;
  projectId: number;
  initialModel?: string;
  finalModel?: string;
  maxToolRounds?: number;
}) {
  // Messages cumulés envoyés au modèle
  const convo: Array<{
    role: string;
    content: string;
    tool_call_id?: string;
    name?: string;
    tool_calls?: Array<{ id: string; function: { name: string; arguments: string }; type: 'function' }>;
  }> = [systemMessage, ...userAndContextMessages];

  // 1er appel (rapide) avec GPT-5 Mini (pour détecter les tools éventuellement)
  const first = await withRetry(
    async () => {
      try {
        return await openai.chat.completions.create({
          model: initialModel,
          messages: convo,
          tools: availableTools,
          tool_choice: 'auto',
          reasoning_effort: 'medium',
          parallel_tool_calls: true,   // ⬅️ utile pour add_task multiples

          // Paramètres de génération (ajuste selon ton usage)
          temperature: 1,
          top_p: 1,
          // IMPORTANT pour GPT-5 : respecter les nouveaux champs de sortie
          max_completion_tokens: 20000, // capacité large quand il y a des outils
          response_format: { type: 'text' },
        } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming);
      } catch (error: unknown) {
        const err = error as { status?: number };
        if (err?.status === 429) {
          logWarn('OpenAI rate limit hit', { projectId });
          throw new ExternalServiceError('OpenAI (limite atteinte)', error as Error);
        }
        if (err?.status && err.status >= 500) {
          throw new ExternalServiceError('OpenAI', error as Error);
        }
        throw error;
      }
    },
    3,
    2000
  );

  let assistantMsg = first.choices[0].message;
  convo.push({
    role: assistantMsg.role,
    content: assistantMsg.content || '',
    tool_calls: assistantMsg.tool_calls as Array<{
      id: string;
      function: { name: string; arguments: string };
      type: 'function';
    }>,
  });

  // Boucler sur les tools s'il y en a
  let rounds = 0;
  while (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0 && rounds < maxToolRounds) {
    rounds += 1;

    // Exécuter tous les outils détectés
    const toolResults = await runToolCalls(
      assistantMsg.tool_calls as Array<{
        id: string;
        function: { name: string; arguments: string };
        type: 'function';
      }>,
      projectId
    );
    convo.push(...toolResults);

    // Appel "final" (plus réfléchi) avec GPT-5
    const next = await withRetry(
      async () => {
        try {
          return await openai.chat.completions.create({
            model: finalModel,
            messages: convo,
            // Pas besoin de tools à ce tour-ci si on veut forcer la synthèse,
            // mais on les laisse pour permettre des enchaînements si nécessaire :
            tools: availableTools,
            tool_choice: 'auto',
            temperature: 1,
            top_p: 1,
            reasoning_effort: 'medium',
            max_completion_tokens: 20000, // borne plus raisonnable
            response_format: { type: 'text' },
            parallel_tool_calls: true,
          } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming);
        } catch (error: unknown) {
          const err = error as { status?: number };
          if (err?.status && err.status >= 500) {
            throw new ExternalServiceError('OpenAI', error as Error);
          }
          throw error;
        }
      },
      2,
      2000
    );

    assistantMsg = next.choices[0].message;
    convo.push({
      role: assistantMsg.role,
      content: assistantMsg.content || '',
      tool_calls: assistantMsg.tool_calls as Array<{
        id: string;
        function: { name: string; arguments: string };
        type: 'function';
      }>,
    });
  }

  // Si pas de contenu textuel (rare), fournir un message par défaut
  let content = assistantMsg.content;
  
  // Si pas de contenu mais des tool_calls, générer un message de confirmation
  if (!content && assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
    content = `✅ J'ai exécuté ${assistantMsg.tool_calls.length} action${
      assistantMsg.tool_calls.length > 1 ? 's' : ''
    }.`;
  }
  
  // Si vraiment aucun contenu ni tool_calls, mettre un message par défaut
  if (!content) {
    content = '✅ Action effectuée.';
  }

  // Nettoyage des traces techniques
  const originalLength = content.length;
  content = redactToolTraces(content);
  
  // Si le nettoyage a tout supprimé et qu'on a des tool_calls, générer un message par défaut
  if (!content && assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
    const toolNames = assistantMsg.tool_calls
      .map((tc) => {
        if ('function' in tc && tc.function?.name) {
          return tc.function.name;
        }
        return undefined;
      })
      .filter(Boolean);
    content = `✅ Action${toolNames.length > 1 ? 's' : ''} effectuée${toolNames.length > 1 ? 's' : ''} avec succès.`;
    logWarn('redactToolTraces removed all content, using fallback', { projectId, originalLength, toolNames });
  }

  // Log si réduction significative (pour surveiller la fonction de nettoyage)
  if (originalLength > 100 && content.length < originalLength * 0.5) {
    logInfo('Significant content reduction after redaction', {
      projectId,
      originalLength,
      cleanedLength: content.length,
      reductionPercent: Math.round((1 - content.length / originalLength) * 100),
    });
  }

  // Persistance
  if (projectId && content) {
    persistAssistantMessage(projectId, content);
  }

  // Rapport d'usage (facultatif)
  logInfo('Chat completed', {
    projectId,
    toolRounds: rounds,
    hadToolCalls: !!assistantMsg.tool_calls?.length,
    messageLength: content.length,
  });

  return {
    message: content,
    tool_calls:
      assistantMsg.tool_calls
        ?.map((tc) => {
          if ('function' in tc && tc.function?.name) {
            return tc.function.name;
          }
          return undefined;
        })
        .filter(Boolean) ?? [],
    tool_results: (assistantMsg.tool_calls?.length ?? 0) > 0 ? 'executed' : 'none',
  };
}

// ---------- Handlers HTTP ----------

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const validated = chatMessageSchema.parse(body);
    const { messages, project_id } = validated;

    if (!project_id) {
      throw new Error('project_id requis');
    }

    // Rate limiting sur le projet
    const rateLimitKey = `project:${project_id}`;
    checkRateLimit(
      openaiRateLimiter,
      rateLimitKey,
      `Limite de requêtes IA atteinte pour ce projet. Vous pouvez faire ${openaiRateLimiter['config'].maxRequests} requêtes par heure.`
    );

    // Construit le message système enrichi
    const systemMessage = await buildSystemMessage(project_id.toString());

    // Boucle d'inférence + tools (multi-rounds)
    const result = await completeWithToolsLoop({
      systemMessage,
      userAndContextMessages: messages,
      projectId: project_id,
      initialModel: 'gpt-5-mini',
      finalModel: 'gpt-5-mini',
      maxToolRounds: 30, // ajuste si besoin
    });

    // withErrorHandling s'occupe déjà de wrapper avec NextResponse.json()
    return result;
  });
}

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get('project_id');

    if (!project_id) {
      throw new Error('project_id requis');
    }

    const history = db
      .prepare(
        `SELECT * FROM chat_history WHERE project_id = ? ORDER BY created_at ASC`
      )
      .all(project_id);

    return NextResponse.json(history);
  });
}
