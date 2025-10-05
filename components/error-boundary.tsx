'use client';

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    this.setState({ error, errorInfo });

    // En production, envoyer vers un service de monitoring
    if (process.env.NODE_ENV === 'production') {
      // TODO: Intégrer avec Sentry/LogRocket
      console.error('Production error:', error);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Une erreur est survenue</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Nous sommes désolés pour ce désagrément
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {this.state.error && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-mono text-gray-800 mb-2">
                    {this.state.error.message}
                  </p>
                  {process.env.NODE_ENV === 'development' && this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                        Détails techniques
                      </summary>
                      <pre className="text-xs text-gray-600 mt-2 overflow-auto max-h-48">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Vous pouvez essayer de :
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  <li>Recharger la page</li>
                  <li>Vérifier votre connexion internet</li>
                  <li>Retourner à la page d&apos;accueil</li>
                  <li>Contacter le support si le problème persiste</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button onClick={this.handleReset} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Réessayer
                </Button>
                <Link href="/">
                  <Button variant="outline" className="gap-2">
                    <Home className="w-4 h-4" />
                    Page d&apos;accueil
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

