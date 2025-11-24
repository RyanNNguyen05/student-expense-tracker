import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

export default function ExpenseScreen() {
  const db = useSQLiteContext();

  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');

  const [filter, setFilter] = useState('All');

  const [isEditing, setIsEditing] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editDate, setEditDate] = useState('');


  const loadExpenses = async () => {
    let query = 'SELECT * FROM expenses';
    let params = [];
    if (filter === 'ThisWeek') {
      const today = new Date();
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay()))
      .toISOString()
      .split('T')[0];
      query += ' WHERE date >= ?';
      params.push(firstDay);
    } else if (filter === 'ThisMonth') {
      const today = new Date();
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split('T')[0];
      query += ' WHERE date >= ?';
      params.push(firstOfMonth);
    }
    query += ' ORDER BY date DESC;';
    const rows = await db.getAllAsync(query, params);
    setExpenses(rows);
  };
  useEffect(() => {
    loadExpenses();
  }, [filter]);
  const addExpense = async () => {
    const amountNumber = parseFloat(amount);

    if (isNaN(amountNumber) || amountNumber <= 0) {
      // Basic validation: ignore invalid or non-positive amounts
      return;
    }

    const trimmedCategory = category.trim();
    const trimmedNote = note.trim();

    if (!trimmedCategory) {
      // Category is required
      return;
    }
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    await db.runAsync(
      'INSERT INTO expenses (amount, category, note, date) VALUES (?, ?, ?, ?);',
      [amountNumber, trimmedCategory, trimmedNote || null, today]
    );

    setAmount('');
    setCategory('');
    setNote('');

    loadExpenses();
  };


  const deleteExpense = async (id) => {
    await db.runAsync('DELETE FROM expenses WHERE id = ?;', [id]);
    loadExpenses();
  };
  const startEdit = (expense) => {
  setIsEditing(true);
  setEditingExpense(expense);
  setEditAmount(String(expense.amount));
  setEditCategory(expense.category);
  setEditNote(expense.note || '');
  setEditDate(expense.date);
};
const saveEdit = async () => {
  if (!editingExpense) return;
  const amountNumber = parseFloat(editAmount);
  if (isNaN(amountNumber) || amountNumber <= 0) {
    Alert.alert("Invalid amount");
    return;
  }
  await db.runAsync(
    `
    UPDATE expenses
    SET amount = ?, category = ?, note = ?, date = ?
    WHERE id = ?;
    `,
    [amountNumber, editCategory, editNote || null, editDate, editingExpense.id]
  );
setIsEditing(false);
setEditingExpense(null);
loadExpenses();
};


  const renderExpense = ({ item }) => (
    <View style={styles.expenseRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.expenseAmount}>${Number(item.amount).toFixed(2)}</Text>
        <Text style={styles.expenseCategory}>{item.category}</Text>
        {item.note ? <Text style={styles.expenseNote}>{item.note}</Text> : null}
      </View>
<TouchableOpacity onPress={() => startEdit(item)}>
      <Text style={{ color: '#60a5fa', fontSize: 18, marginRight: 12 }}>Edit</Text>
    </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteExpense(item.id)}>
        <Text style={styles.delete}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    async function setup() {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          note TEXT,
          date TEXT NOT NULL
        );
      `);

      await loadExpenses();
    }

    setup();
  }, []);
const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0);
const categoryTotals = expenses.reduce((totals, e) => {
  if (!totals[e.category]) totals[e.category] = 0;
  totals[e.category] += e.amount;
  return totals;
}, {});
  return (
    
    <SafeAreaView style={styles.container}>
      <View style={{ marginBottom: 16}}>
        {Object.entries(categoryTotals).map(([category, amt]) => (
          <Text key={category} style={{ color: '#fff' }}>
            {category}: ${amt.toFixed(2)}
          </Text>
        ))}
      </View>
      <Text style={{ color: '#fff', fontWeight: '700', marginVertical: 8 }}>
      Total: ${totalSpending.toFixed(2)}
    </Text>
      <Text style={styles.heading}>Student Expense Tracker</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Amount (e.g. 12.50)"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={styles.input}
          placeholder="Category (Food, Books, Rent...)"
          placeholderTextColor="#9ca3af"
          value={category}
          onChangeText={setCategory}
        />
        <TextInput
          style={styles.input}
          placeholder="Note (optional)"
          placeholderTextColor="#9ca3af"
          value={note}
          onChangeText={setNote}
        />
        <Button title="Add Expense" onPress={addExpense} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12}}>
          {['All', 'ThisWeek', 'ThisMonth'].map(f => (
            <Button
            key={f}
            title={f === 'ThisWeek' ? 'This Week' : f === 'ThisMonth' ? 'This Month' : 'All'}
            onPress={() => setFilter(f)}
            />
          ))}
        </View>
      </View>
      
      
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderExpense}
        ListEmptyComponent={
          <Text style={styles.empty}>No expenses yet.</Text>
        }
      />

      <Text style={styles.footer}>
        Enter your expenses and they’ll be saved locally with SQLite.
      </Text>
      <Modal visible={isEditing} animationType="slide" transparent={true}>
  <View style={{ flex: 1, backgroundColor: '#000000aa', justifyContent: 'center' }}>
    <View style={{ backgroundColor: '#1f2937', margin: 20, padding: 20, borderRadius: 10 }}>
      <Text style={{ color: '#fff', fontSize: 18, marginBottom: 10 }}>Edit Expense</Text>

      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={editAmount}
        onChangeText={setEditAmount}
        placeholder="Amount"
        placeholderTextColor="#9ca3af"
      />

      <TextInput
        style={styles.input}
        value={editCategory}
        onChangeText={setEditCategory}
        placeholder="Category"
        placeholderTextColor="#9ca3af"
      />

      <TextInput
        style={styles.input}
        value={editNote}
        onChangeText={setEditNote}
        placeholder="Note"
        placeholderTextColor="#9ca3af"
      />

      <TextInput
        style={styles.input}
        value={editDate}
        onChangeText={setEditDate}
        placeholder="Date (YYYY-MM-DD)"
        placeholderTextColor="#9ca3af"
      />

      <Button title="Save Changes" onPress={saveEdit} />
      <View style={{ height: 10 }} />
      <Button title="Cancel" color="red" onPress={() => setIsEditing(false)} />
    </View>
  </View>
</Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#111827' },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  form: {
    marginBottom: 16,
    gap: 8,
  },
  input: {
    padding: 10,
    backgroundColor: '#1f2937',
    color: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fbbf24',
  },
  expenseCategory: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  expenseNote: {
    fontSize: 12,
    color: '#9ca3af',
  },
  delete: {
    color: '#f87171',
    fontSize: 20,
    marginLeft: 12,
  },
  empty: {
    color: '#9ca3af',
    marginTop: 24,
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 12,
    fontSize: 12,
  },
});