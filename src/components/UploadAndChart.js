import React, { useState } from 'react';
import CSVReader from 'react-csv-reader';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const UploadAndChart = () => {
    const [data, setData] = useState([]);

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

    return (
        <div>
            <h2>Upload CSV and View Event Check-In Chart</h2>
            <CSVReader onFileLoaded={handleFileUpload} />
            {data.length > 0 && (
                <ResponsiveContainer width="100%" height={600}>
                    <BarChart
                        data={data}
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
            )}
        </div>
    );
};

export default UploadAndChart;