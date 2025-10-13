import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 4,
  },
  item: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1pt solid #e2e8f0',
    alignItems: 'center',
  },
  checkbox: {
    width: 12,
    height: 12,
    border: '1pt solid #94a3b8',
    marginRight: 10,
    borderRadius: 2,
  },
  checkboxChecked: {
    width: 12,
    height: 12,
    backgroundColor: '#22c55e',
    border: '1pt solid #16a34a',
    marginRight: 10,
    borderRadius: 2,
  },
  itemName: {
    flex: 2,
    fontSize: 11,
    color: '#1e293b',
  },
  itemQuantity: {
    width: 50,
    textAlign: 'center',
    fontSize: 11,
    color: '#475569',
  },
  itemPrice: {
    width: 80,
    textAlign: 'right',
    fontSize: 11,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  summary: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
    border: '1pt solid #bfdbfe',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#475569',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '2pt solid #2563eb',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
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
  note: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#fef3c7',
    border: '1pt solid #fde047',
    borderRadius: 4,
  },
  noteText: {
    fontSize: 10,
    color: '#854d0e',
  },
});

interface ShoppingListData {
  project: {
    name: string;
  };
  materiaux: Array<{
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    status: string;
    category?: string;
  }>;
  meubles: Array<{
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    status: string;
    category?: string;
  }>;
  stats: {
    total_items: number;
    purchased_items: number;
    total_cost: number;
    purchased_cost: number;
  };
}

export function ShoppingListPDF({ data }: { data: ShoppingListData }) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  const renderItems = (items: Array<any>, title: string, icon: string) => {
    if (items.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {icon} {title}
        </Text>
        {items.map((item, index) => (
          <View key={index} style={styles.item}>
            <View
              style={item.status === 'purchased' ? styles.checkboxChecked : styles.checkbox}
            />
            <Text style={styles.itemName}>
              {item.item_name}
              {item.category && ` (${item.category})`}
            </Text>
            <Text style={styles.itemQuantity}>x{item.quantity}</Text>
            <Text style={styles.itemPrice}>{formatCurrency(item.total_price)}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🛒 Liste de Courses</Text>
          <Text style={styles.subtitle}>
            {data.project.name} - {new Date().toLocaleDateString('fr-FR')}
          </Text>
        </View>

        {/* Note */}
        <View style={styles.note}>
          <Text style={styles.noteText}>
            💡 Conseil: Imprimez cette liste et cochez les articles au fur et à mesure de vos
            achats.
          </Text>
        </View>

        {/* Matériaux */}
        {renderItems(data.materiaux, 'Matériaux de Construction', '🔨')}

        {/* Meubles */}
        {renderItems(data.meubles, 'Meubles et Équipements', '🪑')}

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={[styles.sectionTitle, { backgroundColor: 'transparent', padding: 0, marginBottom: 10 }]}>
            📊 Résumé
          </Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Articles au total:</Text>
            <Text style={styles.summaryValue}>{data.stats.total_items}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Articles achetés:</Text>
            <Text style={styles.summaryValue}>
              {data.stats.purchased_items} /{' '}
              {data.stats.total_items > 0
                ? `${((data.stats.purchased_items / data.stats.total_items) * 100).toFixed(0)}%`
                : '0%'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Coût total estimé:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.stats.total_cost)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Déjà dépensé:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.stats.purchased_cost)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Reste à acheter:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(data.stats.total_cost - data.stats.purchased_cost)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          RennoPlanner - Liste de courses - Généré le {new Date().toLocaleDateString('fr-FR')}
        </Text>
      </Page>
    </Document>
  );
}

