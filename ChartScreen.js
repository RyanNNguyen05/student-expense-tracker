import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, ScrollView } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { getDBConnection, fetchExpenses } from './db-service';

const screenWidth = Dimensions.get('window').width;

export default function ChartScreen() { 
    const [monthlyTotals, setMonthlyTotals] = useState({ labels: [], data: [] });

useEffect(() => {
    async function loadData() {
        const db = await getDBConnection();
        const all = await fetchExpenses(db);
        const byMonth = {};
        all.forEach(item => {
            const m = new Date(item.date).getMonth();
            byMonth[m] = (byMonth[m] || 0) + item.amount;
        });
        const labels = [];
        const data = [];

        for (let i = 0; i < 12; i++) {
            labels.push(["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i]);
            data.push(byMonth[i] || 0);
        }
        setMonthlyTotals({ labels, data });
    }
    loadData();
}, []);
if (monthlyTotals.data.length === 0) {
    return <Text>Loading...</Text>;
}
const chartData = {
    labels: monthlyTotals.labels,
    datasets: [{ data: monthlyTotals.data }],
};
const chartConfig = {
    backgroundGradientFrom: '#f5f5f5',
    backgroundGradientTo: '#f5f5f5',
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    fillShadowGradient: '#007AFF',
    fillShadowGradientOpacity: 0.8,
    barPercentage: 0.5,
    decimalPlaces: 2,
    labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
};
return (
    <ScrollView>
        <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 20, textAlign: 'center', marginBottom: 8}}>
                Monthly Expenses
            </Text>
            <BarChart
            data={chartData}
            width={screenWidth - 32}
            height={260}
            yAxisLabel='$'
            chartConfig={chartConfig}
            fromZero
            verticalLabelRotation={30}
            />
        </View>
    </ScrollView>
);
}