// App.js
import React from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import ExpenseScreen from './ExpenseScreen';
import ChartScreen from './ChartScreen';

import { NavigationContainer } from '@react0navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SQLiteProvider databaseName="expenses.db">
      <NavigationContainer>
        <Stack.Navigator>
          <Stacked.Screen name="Expenses" component={ExpenseScreen} />
          <Stacked.Screen name="Charts" component={ChartScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <ExpenseScreen />
    </SQLiteProvider>
  );
}
