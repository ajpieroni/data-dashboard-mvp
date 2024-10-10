import React, { useState } from 'react';
import CSVReader from 'react-csv-reader';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import Select from 'react-select';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c', '#d0ed57', '#d0ed6e'];

/** Custom Paginated Legend Component **/
const PaginatedLegend = (props) => {
    const { payload } = props;
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(payload.length / itemsPerPage);

    const startIndex = currentPage * itemsPerPage;
    const paginatedItems = payload.slice(startIndex, startIndex + itemsPerPage);

    const handleNextPage = () => {
        setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages - 1));
    };

    const handlePrevPage = () => {
        setCurrentPage((prevPage) => Math.max(prevPage - 1, 0));
    };

    return (
        <div>
            <ul className="recharts-default-legend">
                {paginatedItems.map((entry, index) => (
                    <li key={`item-${startIndex + index}`} className="legend-item">
                        <span
                            className="legend-color"
                            style={{ backgroundColor: entry.color }}
                        ></span>
                        {entry.value}
                    </li>
                ))}
            </ul>
            <div className="legend-pagination">
                <button onClick={handlePrevPage} disabled={currentPage === 0}>
                    Previous
                </button>
                <span>
                    Page {currentPage + 1} of {totalPages}
                </span>
                <button onClick={handleNextPage} disabled={currentPage === totalPages - 1}>
                    Next
                </button>
            </div>
        </div>
    );
};

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
            return { chapter, percentageCheckedIn };
        });

        // Aggregate data by chapter
        let aggregatedData = processedData.reduce((acc, curr) => {
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
            averagePercentage: item.totalPercentage / item.eventCount,
            eventCount: item.eventCount
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
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={filteredData}
                            margin={{ top: 20, right: 30, left: 30, bottom: 100 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="chapter" angle={-45} textAnchor="end" interval={0} />
                            <YAxis tickFormatter={formatPercentage} />
                            <Tooltip formatter={(value, name, props) => [`${formatPercentage(value)} - ${props.payload.eventCount} events`, 'Average Percentage']} />
                            <Bar dataKey="averagePercentage" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie
                                data={filteredData}
                                dataKey="averagePercentage" // Corrected dataKey
                                nameKey="chapter"
                                cx="50%"
                                cy="50%"
                                outerRadius={150}
                                fill="#8884d8"
                                label={({ chapter, averagePercentage, eventCount }) => `${chapter}: ${formatPercentage(averagePercentage)}, ${eventCount} events`}
                                labelLine={false}
                            >
                                {filteredData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name, props) => [`${formatPercentage(value)} - ${props.payload.eventCount} events`, 'Average Percentage']} />
                            <Legend content={PaginatedLegend} />
                        </PieChart>
                    </ResponsiveContainer>
                </>
            )}
        </div>
    );
};

export default UploadAndChart;