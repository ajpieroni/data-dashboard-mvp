import React, { useState } from 'react';
import CSVReader from 'react-csv-reader';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, ScatterChart, Scatter, Legend, Line, LabelList
} from 'recharts';
import Select from 'react-select';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c', '#d0ed57', '#d0ed6e'];

const UploadAndChart = () => {
    const [data, setData] = useState([]);
    const [selectedChapters, setSelectedChapters] = useState([]);
    const [options, setOptions] = useState([]);
    const [correlation, setCorrelation] = useState(0);

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

        // Calculate correlation between eventCount and averagePercentage
        const correlationValue = calculateCorrelation(aggregatedData, 'eventCount', 'averagePercentage');
        setCorrelation(correlationValue);

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
        chapters: [],
        count: 0
    }));

    filteredData.forEach(item => {
        const index = Math.min(Math.floor(item.averagePercentage / 10), 9);
        histogramBins[index].count += 1;
        histogramBins[index].chapters.push(item.chapter);
    });

    const histogramData = histogramBins.filter(bin => bin.count > 0);

    // Function to calculate Pearson correlation coefficient
    const calculateCorrelation = (dataArray, xKey, yKey) => {
        const n = dataArray.length;
        const sumX = dataArray.reduce((sum, item) => sum + item[xKey], 0);
        const sumY = dataArray.reduce((sum, item) => sum + item[yKey], 0);
        const sumXY = dataArray.reduce((sum, item) => sum + item[xKey] * item[yKey], 0);
        const sumX2 = dataArray.reduce((sum, item) => sum + item[xKey] * item[xKey], 0);
        const sumY2 = dataArray.reduce((sum, item) => sum + item[yKey] * item[yKey], 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator !== 0 ? numerator / denominator : 0;
    };

    return (
        <div>
            <h1>Event Check-In Analysis Dashboard</h1>
            <p>
                Upload your event CSV data to visualize insights on chapter performance.
                The dashboard provides an overview of average check-in percentages,
                ticket sales, event frequency, and distribution patterns across chapters.
            </p>
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
                    <h3>Average Check-In Percentage per Chapter</h3>
                    <p>This chart shows the average percentage of attendees who checked in for events hosted by each chapter.</p>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={filteredData}
                            margin={{ top: 20, right: 30, left: 30, bottom: 100 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="chapter" angle={-45} textAnchor="end" interval={0}>
                                <LabelList dataKey="chapter" position="insideBottom" angle={-45} offset={-10} />
                            </XAxis>
                            <YAxis tickFormatter={formatPercentage} />
                            <Tooltip formatter={(value, name, props) => [`${formatPercentage(value)}`, 'Average Percentage']} />
                            <Bar dataKey="averagePercentage" fill="#82ca9d" name="Average Percentage">
                                <LabelList dataKey="chapter" position="top" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <p>
                        <strong>Insight:</strong> Chapters with higher average check-in percentages may have more engaged audiences.
                    </p>

                    {/* Stacked Bar Chart of Tickets Sold and Tickets Available */}
                    <h3>Tickets Sold vs. Tickets Available per Chapter</h3>
                    <p>This chart compares the total tickets sold and tickets available for each chapter.</p>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={filteredData}
                            margin={{ top: 20, right: 30, left: 30, bottom: 100 }}
                            barCategoryGap="10%"
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="chapter" angle={-45} textAnchor="end" interval={0} />
                            <YAxis />
                            <Tooltip formatter={(value, name) => [value, name]} />
                            <Legend />
                            <Bar dataKey="totalTicketsAvailable" fill="#8884d8" name="Tickets Available" />
                            <Bar dataKey="totalTicketsSold" fill="#82ca9d" name="Tickets Sold" />
                        </BarChart>
                    </ResponsiveContainer>
                    <p>
                        <strong>Insight:</strong> Chapters selling close to or exceeding their available tickets might need to increase capacity.
                    </p>

                    {/* Scatter Plot of Event Count vs. Average Percentage */}
                    <h3>Event Count vs. Average Check-In Percentage per Chapter</h3>
                    <p>This scatter plot analyzes the relationship between the number of events and average check-in percentage for each chapter.</p>
                    <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart
                            margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
                        >
                            <CartesianGrid />
                            <XAxis type="number" dataKey="eventCount" name="Event Count" />
                            <YAxis type="number" dataKey="averagePercentage" name="Average Percentage" tickFormatter={formatPercentage} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => name === 'Average Percentage' ? formatPercentage(value) : value} />
                            <Scatter name="Chapters" data={filteredData} fill="#8884d8">
                                <LabelList dataKey="chapter" position="top" />
                            </Scatter>
                            {/* Optional: Add trend line */}
                            <Line
                                type="monotone"
                                dataKey="averagePercentage"
                                data={filteredData.sort((a, b) => a.eventCount - b.eventCount)}
                                stroke="#ff7300"
                                dot={false}
                            />
                        </ScatterChart>
                    </ResponsiveContainer>
                    <p>
                        <strong>Correlation Coefficient:</strong> {correlation.toFixed(2)}
                        <br />
                        <strong>Insight:</strong> {correlationAnalysisText(correlation)}
                    </p>

                    {/* Histogram of Average Percentage Across Chapters */}
                    <h3>Distribution of Average Check-In Percentage Across Chapters</h3>
                    <p>This histogram shows how chapters are distributed across different average check-in percentage ranges.</p>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={histogramData}
                            margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="bin" />
                            <YAxis />
                            <Tooltip formatter={(value, name, props) => [`${value} chapters: ${props.payload.chapters.join(', ')}`, 'Number of Chapters']} />
                            <Bar dataKey="count" fill="#82ca9d" name="Number of Chapters">
                                <LabelList dataKey="count" position="top" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <p>
                        <strong>Insight:</strong> This distribution helps identify common performance levels and outliers among chapters.
                    </p>
                </>
            )}
        </div>
    );
};

// Helper function to generate insight text based on correlation
const correlationAnalysisText = (correlation) => {
    if (correlation > 0.7) {
        return 'There is a strong positive correlation between event count and average check-in percentage. Chapters hosting more events tend to have higher engagement.';
    } else if (correlation > 0.3) {
        return 'There is a moderate positive correlation between event count and average check-in percentage.';
    } else if (correlation > -0.3) {
        return 'There is little to no correlation between event count and average check-in percentage.';
    } else if (correlation > -0.7) {
        return 'There is a moderate negative correlation between event count and average check-in percentage.';
    } else {
        return 'There is a strong negative correlation between event count and average check-in percentage. Chapters hosting more events tend to have lower engagement.';
    }
};

export default UploadAndChart;