import React, { useState } from 'react';
import CSVReader from 'react-csv-reader';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import Select from 'react-select';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c', '#d0ed57', '#d0ed6e'];

const UploadAndChart = () => {
    const [data, setData] = useState([]);
    const [selectedChapters, setSelectedChapters] = useState([]);

    const handleFileUpload = (data) => {
        const processedData = data.slice(1).map(row => {
            const [event, , , ticketsSold, ticketsAvailable] = row;
            const percentageCheckedIn = ticketsAvailable > 0 ? (ticketsSold / ticketsAvailable) * 100 : 0;
            const chapter = event.split('|')[0].trim();
            return { chapter, percentageCheckedIn };
        });

        const aggregatedData = processedData.reduce((acc, curr) => {
            const existing = acc.find(item => item.chapter === curr.chapter);
            if (existing) {
                existing.totalPercentage += curr.percentageCheckedIn;
                existing.eventCount += 1;
            } else {
                acc.push({ chapter: curr.chapter, totalPercentage: curr.percentageCheckedIn, eventCount: 1 });
            }
            return acc;
        }, []).map(item => ({
            chapter: item.chapter,
            averagePercentage: item.totalPercentage / item.eventCount
        }));

        setData(aggregatedData);
    };

    const options = data.map(item => ({
        value: item.chapter,
        label: item.chapter,
    }));

    const filteredData = selectedChapters.length > 0 
        ? data.filter(d => selectedChapters.some(sc => sc.value === d.chapter))
        : data;

    return (
        <div>
            <h2>Upload CSV and View Event Check-In Chart</h2>
            <CSVReader onFileLoaded={handleFileUpload} />
            <Select
                isMulti
                options={options}
                onChange={setSelectedChapters}
                placeholder="Filter chapters..."
            />
            {filteredData.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around' }}>
                    <ResponsiveContainer width="45%" height={400}>
                        <BarChart
                            data={filteredData}
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis dataKey="chapter" type="category" />
                            <Tooltip />
                            <Bar dataKey="averagePercentage" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="45%" height={400}>
                        <PieChart>
                            <Pie
                                data={filteredData}
                                dataKey="averagePercentage"
                                nameKey="chapter"
                                cx="50%"
                                cy="50%"
                                outerRadius={150}
                                fill="#8884d8"
                                label
                            >
                                {filteredData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default UploadAndChart;