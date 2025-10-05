'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Home, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ProjectCardSkeleton } from '@/components/loading-skeleton';

export default function HomePage() {
  const { projects, isLoading, fetchProjects, createProject } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    total_budget: '',
  });

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProject({
      name: newProject.name,
      description: newProject.description,
      total_budget: parseFloat(newProject.total_budget) || 0,
    });
    setNewProject({ name: '', description: '', total_budget: '' });
    setShowCreateForm(false);
  };

  if (isLoading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto p-8">
          <div className="mb-8">
            <div className="h-10 w-96 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-6 w-full max-w-md bg-gray-100 rounded animate-pulse"></div>
          </div>
          <div className="mb-6">
            <div className="h-11 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Planificateur de Rénovation
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Gérez vos projets de rénovation avec l'aide de l'intelligence artificielle
          </p>
        </div>

        <div className="mb-6">
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="lg"
            className="gap-2 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            Nouveau Projet
          </Button>
        </div>

        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Créer un nouveau projet</CardTitle>
              <CardDescription>
                Commencez votre projet de rénovation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nom du projet *
                  </label>
                  <Input
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject({ ...newProject, name: e.target.value })
                    }
                    placeholder="Ex: Rénovation appartement Paris"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <Input
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({ ...newProject, description: e.target.value })
                    }
                    placeholder="Description du projet..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Budget total (€)
                  </label>
                  <Input
                    type="number"
                    value={newProject.total_budget}
                    onChange={(e) =>
                      setNewProject({ ...newProject, total_budget: e.target.value })
                    }
                    placeholder="50000"
                    min="0"
                    step="100"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Créer le projet</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Home className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Aucun projet pour le moment
              </h3>
              <p className="text-gray-600 mb-4">
                Créez votre premier projet de rénovation pour commencer
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un projet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="w-5 h-5 text-blue-600" />
                      {project.name}
                    </CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Budget</span>
                        <span className="font-semibold">
                          {formatCurrency(project.total_budget || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Créé le</span>
                        <span>{formatDate(project.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
