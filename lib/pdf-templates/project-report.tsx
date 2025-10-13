import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  section: {
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
    borderBottom: '1pt solid #e2e8f0',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
    color: '#475569',
  },
  value: {
    width: '60%',
    color: '#1e293b',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 8,
    fontWeight: 'bold',
    borderBottom: '1pt solid #cbd5e1',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1pt solid #e2e8f0',
  },
  tableCol: {
    flex: 1,
  },
  budget: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 4,
    marginTop: 10,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  budgetLabel: {
    fontSize: 12,
    color: '#475569',
  },
  budgetValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#94a3b8',
    borderTop: '1pt solid #e2e8f0',
    paddingTop: 10,
  },
  badge: {
    fontSize: 9,
    padding: '3px 6px',
    borderRadius: 3,
    marginLeft: 5,
  },
  statusTodo: {
    backgroundColor: '#e2e8f0',
    color: '#475569',
  },
  statusInProgress: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  statusCompleted: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  statusBlocked: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
});

interface ProjectReportData {
  project: {
    name: string;
    description?: string;
    total_budget?: number;
    created_at: string;
  };
  rooms: Array<{
    id: string;
    name: string;
    surface_area?: number;
    allocated_budget?: number;
    task_count: number;
  }>;
  tasks: Array<{
    title: string;
    room_name: string;
    status: string;
    priority: string;
    category: string;
    estimated_cost?: number;
    actual_cost?: number;
  }>;
  purchases: Array<{
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    status: string;
    item_type: string;
  }>;
  stats: {
    total_tasks: number;
    completed_tasks: number;
    total_budget: number;
    total_spent: number;
    completion_rate: number;
  };
}

export function ProjectReportPDF({ data }: { data: ProjectReportData }) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{data.project.name}</Text>
          <Text style={styles.subtitle}>
            Rapport généré le {new Date().toLocaleDateString('fr-FR')}
          </Text>
        </View>

        {/* Project Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Informations du Projet</Text>
          {data.project.description && (
            <View style={styles.row}>
              <Text style={styles.label}>Description:</Text>
              <Text style={styles.value}>{data.project.description}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Date de création:</Text>
            <Text style={styles.value}>{formatDate(data.project.created_at)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre de pièces:</Text>
            <Text style={styles.value}>{data.rooms.length}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre de tâches:</Text>
            <Text style={styles.value}>{data.stats.total_tasks}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Taux d&apos;avancement:</Text>
            <Text style={styles.value}>{data.stats.completion_rate.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Budget Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Résumé Budgétaire</Text>
          <View style={styles.budget}>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Budget Total:</Text>
              <Text style={styles.budgetValue}>{formatCurrency(data.stats.total_budget)}</Text>
            </View>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Dépensé:</Text>
              <Text style={styles.budgetValue}>{formatCurrency(data.stats.total_spent)}</Text>
            </View>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Restant:</Text>
              <Text style={styles.budgetValue}>
                {formatCurrency(data.stats.total_budget - data.stats.total_spent)}
              </Text>
            </View>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Utilisation:</Text>
              <Text style={styles.budgetValue}>
                {((data.stats.total_spent / data.stats.total_budget) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Rooms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏠 Pièces</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCol, { flex: 2 }]}>Nom</Text>
              <Text style={styles.tableCol}>Surface</Text>
              <Text style={styles.tableCol}>Budget</Text>
              <Text style={styles.tableCol}>Tâches</Text>
            </View>
            {data.rooms.map((room, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCol, { flex: 2 }]}>{room.name}</Text>
                <Text style={styles.tableCol}>{room.surface_area ? `${room.surface_area} m²` : '-'}</Text>
                <Text style={styles.tableCol}>
                  {room.allocated_budget ? formatCurrency(room.allocated_budget) : '-'}
                </Text>
                <Text style={styles.tableCol}>{room.task_count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          RennoPlanner - Rapport de projet - Page 1
        </Text>
      </Page>

      {/* Page 2: Tasks */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Tâches</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCol, { flex: 2 }]}>Titre</Text>
              <Text style={styles.tableCol}>Pièce</Text>
              <Text style={styles.tableCol}>Statut</Text>
              <Text style={styles.tableCol}>Coût estimé</Text>
            </View>
            {data.tasks.map((task, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCol, { flex: 2 }]}>{task.title}</Text>
                <Text style={styles.tableCol}>{task.room_name}</Text>
                <Text style={styles.tableCol}>{task.status}</Text>
                <Text style={styles.tableCol}>
                  {task.estimated_cost ? formatCurrency(task.estimated_cost) : '-'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>
          RennoPlanner - Rapport de projet - Page 2
        </Text>
      </Page>

      {/* Page 3: Purchases */}
      {data.purchases.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛒 Achats</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCol, { flex: 2 }]}>Article</Text>
                <Text style={styles.tableCol}>Qté</Text>
                <Text style={styles.tableCol}>Prix unit.</Text>
                <Text style={styles.tableCol}>Total</Text>
                <Text style={styles.tableCol}>Statut</Text>
              </View>
              {data.purchases.map((purchase, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCol, { flex: 2 }]}>{purchase.item_name}</Text>
                  <Text style={styles.tableCol}>{purchase.quantity}</Text>
                  <Text style={styles.tableCol}>{formatCurrency(purchase.unit_price)}</Text>
                  <Text style={styles.tableCol}>{formatCurrency(purchase.total_price)}</Text>
                  <Text style={styles.tableCol}>{purchase.status}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.footer}>
            RennoPlanner - Rapport de projet - Page 3
          </Text>
        </Page>
      )}
    </Document>
  );
}

