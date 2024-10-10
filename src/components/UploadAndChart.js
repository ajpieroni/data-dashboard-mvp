import React, { useState } from 'react';
import CSVReader from 'react-csv-reader';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, ScatterChart, Scatter, Legend
} from 'recharts';
import Select from 'react-select';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c', '#d0ed57', '#d0ed6e'];

const UploadAndChart = () => {
    const [data, setData] = useState([]);
    const [selectedChapters, setSelectedChapters] = useState([]);
    const [options, setOptions] = useState([]);

    const handleFileUpload = (uploadedData) => {
        // Assuming the CSV has headers: Event, Tickets Sold, Tickets Available
        const processedData = uploadedData.slice(1).map(row => {
            const [event, , , ticketsSold, ticketsAvailable] = row;
            const ticketsSoldNum = parseFloat(ticketsSold) || 0;
            const ticketsAvailableNum = parseFloat(ticketsAvailable) || 0;

            // Cap ticketsSoldNum at ticketsAvailableNum
            const effectiveTicketsSold = Math.min(ticketsSoldNum, ticketsAvailableNum);

            const percentageCheckedIn = ticketsAvailableNum > 0 ? (effectiveTicketsSold / ticketsAvailableNum) * 100 : 0;
            const chapter = event.split('|')[0].trim();
            return {
                chapter,
                percentageCheckedIn,
                ticketsSoldNum: effectiveTicketsSold,
                ticketsAvailableNum
            };
        });

        // Aggregate data by chapter
        let aggregatedData = processedData.reduce((acc, curr) => {
            const existing = acc.find(item => item.chapter === curr.chapter);
            if (existing) {
                existing.totalPercentage += curr.percentageCheckedIn;
                existing.eventCount += 1;
                existing.totalTicketsSold += curr.ticketsSoldNum;
                existing.totalTicketsAvailable += curr.ticketsAvailableNum;
            } else {
                acc.push({
                    chapter: curr.chapter,
                    totalPercentage: curr.percentageCheckedIn,
                    eventCount: 1,
                    totalTicketsSold: curr.ticketsSoldNum,
                    totalTicketsAvailable: curr.ticketsAvailableNum
                });
            }
            return acc;
        }, []).map(item => ({
            chapter: item.chapter,
            averagePercentage: item.totalPercentage / item.eventCount,
            eventCount: item.eventCount,
            totalTicketsSold: item.totalTicketsSold,
            totalTicketsAvailable: item.totalTicketsAvailable
        }));

        // Sort aggregatedData by eventCount in descending order
        aggregatedData.sort((a, b) => b.eventCount - a.eventCount);

        // Get top 10 chapters
        const topChapters = aggregatedData.slice(0, 10);

        // Create options for the select component
        const newOptions = aggregatedData.map(item => ({
            value: item.chapter,
            label: item.chapter,
        }));

        // Set default selected chapters to the top 10
        const defaultSelectedChapters = topChapters.map(item => ({
            value: item.chapter,
            label: item.chapter,
        }));

        // Update state
        setData(aggregatedData);
        setOptions(newOptions);
        setSelectedChapters(defaultSelectedChapters);
    };

    const formatPercentage = (value) => `${value.toFixed(2)}%`;

    const filteredData = selectedChapters.length > 0
        ? data.filter(d => selectedChapters.some(sc => sc.value === d.chapter))
        : data; // Show all data if no chapters are selected

    // Create histogram data
    const histogramBins = Array.from({ length: 10 }, (_, i) => ({
        bin: `${i * 10}-${(i + 1) * 10}%`,
        count: 0
    }));

    filteredData.forEach(item => {
        const index = Math.min(Math.floor(item.averagePercentage / 10), 9);
        histogramBins[index].count += 1;
    });

    const histogramData = histogramBins.filter(bin => bin.count > 0);

    return (
        <div>
            <h2>Upload CSV and View Event Check-In Chart</h2>
            <CSVReader onFileLoaded={handleFileUpload} />
            {data.length > 0 && (
                <Select
                    isMulti
                    options={options}
                    onChange={setSelectedChapters}
                    placeholder="Filter chapters..."
                    value={selectedChapters}
                />
            )}
            {filteredData.length > 0 && (
                <>
                    {/* Bar Chart of Average Percentage per Chapter */}
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={filteredData}
                            margin={{ top: 20, right: 30, left: 30, bottom: 100 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="chapter" angle={-45} textAnchor="end" interval={0} />
                            <YAxis tickFormatter={formatPercentage} />
                            <Tooltip formatter={(value, name, props) => [`${formatPercentage(value)} - ${props.payload.eventCount} events`, 'Average Percentage']} />
                            <Bar dataKey="averagePercentage" fill="#82ca9d" name="Average Percentage" />
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Stacked Bar Chart of Tickets Sold and Tickets Available */}
                    <h3>Tickets Sold vs. Tickets Available per Chapter</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={filteredData}
                            margin={{ top: 20, right: 30, left: 30, bottom: 100 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="chapter" angle={-45} textAnchor="end" interval={0} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="totalTicketsAvailable" fill="#8884d8" name="Tickets Available" />
                            <Bar dataKey="totalTicketsSold" fill="#82ca9d" name="Tickets Sold" />
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Scatter Plot of Event Count vs. Average Percentage */}
                    <h3>Event Count vs. Average Percentage per Chapter</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart
                            margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
                        >
                            <CartesianGrid />
                            <XAxis type="number" dataKey="eventCount" name="Event Count" />
                            <YAxis type="number" dataKey="averagePercentage" name="Average Percentage" tickFormatter={formatPercentage} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => name === 'Average Percentage' ? formatPercentage(value) : value} />
                            <Scatter name="Chapters" data={filteredData} fill="#8884d8" />
                        </ScatterChart>
                    </ResponsiveContainer>

                    {/* Histogram of Average Percentage Across Chapters */}
                    <h3>Distribution of Average Percentage Across Chapters</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={histogramData}
                            margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="bin" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#82ca9d" name="Number of Chapters" />
                        </BarChart>
                    </ResponsiveContainer>
                </>
            )}
        </div>
    );
};

export default UploadAndChart;