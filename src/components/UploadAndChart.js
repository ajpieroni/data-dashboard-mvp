import React, { useState } from 'react';
import CSVReader from 'react-csv-reader';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const UploadAndChart = () => {
    const [data, setData] = useState([]);

    const handleFileUpload = (data) => {
        // Process the uploaded CSV data
        const processedData = data.slice(1).map(row => {
            const [event, , , ticketsSold, ticketsAvailable] = row;
            const percentageCheckedIn = ticketsAvailable > 0 ? (ticketsSold / ticketsAvailable) * 100 : 0;
            const chapter = event.split('|')[0].trim();
            return { chapter, percentageCheckedIn };
        });

        // Aggregate data by chapter
        const aggregatedData = processedData.reduce((acc, curr) => {
            const existingChapter = acc.find(item => item.chapter === curr.chapter);
            if (existingChapter) {
                existingChapter.percentageCheckedIn += curr.percentageCheckedIn;
                existingChapter.count += 1;
            } else {
                acc.push({ chapter: curr.chapter, percentageCheckedIn: curr.percentageCheckedIn, count: 1 });
            }
            return acc;
        }, []).map(item => ({
            chapter: item.chapter,
            averagePercentageCheckedIn: item.percentageCheckedIn / item.count
        }));

        setData(aggregatedData);
    };

    return (
        <div>
            <h2>Upload CSV and View Event Check-In Chart</h2>
            <CSVReader onFileLoaded={handleFileUpload} />
            {data.length > 0 && (
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data}>
                        <XAxis dataKey="chapter" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="averagePercentageCheckedIn" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default UploadAndChart;