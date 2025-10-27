import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import './Analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');

function Analytics() {
  const [batches, setBatches] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();

    // Socket.IO real-time updates
    socket.on('batchUpdate', () => {
      fetchAnalytics();
    });

    socket.on('batchCreated', () => {
      fetchAnalytics();
    });

    socket.on('batchDeleted', () => {
      fetchAnalytics();
    });

    return () => {
      socket.off('batchUpdate');
      socket.off('batchCreated');
      socket.off('batchDeleted');
    };
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/analytics?days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading analytics...</div>;
  }

  if (error) {
    return <div className="error-container">Error: {error}</div>;
  }

  if (!analytics) {
    return <div className="no-data">No analytics data available</div>;
  }

  // Stage Distribution Chart Data
  const stageDistributionData = {
    labels: Object.keys(analytics.stageDistribution || {}),
    datasets: [{
      label: 'Batches per Stage',
      data: Object.values(analytics.stageDistribution || {}),
      backgroundColor: [
        '#8B4513',
        '#D2691E',
        '#4682B4',
        '#DEB887',
        '#FFD700',
        '#9370DB',
        '#32CD32',
        '#FF8C00',
        '#228B22'
      ],
      borderWidth: 1
    }]
  };

  // Processing Time Chart Data
  const processingTimeData = {
    labels: Object.keys(analytics.averageProcessingTime || {}),
    datasets: [{
      label: 'Average Days',
      data: Object.values(analytics.averageProcessingTime || {}),
      backgroundColor: '#4682B4',
      borderColor: '#1E4D7B',
      borderWidth: 1
    }]
  };

  // Quality Distribution Chart Data
  const qualityDistributionData = {
    labels: Object.keys(analytics.qualityDistribution || {}),
    datasets: [{
      label: 'Batches',
      data: Object.values(analytics.qualityDistribution || {}),
      backgroundColor: ['#32CD32', '#FFD700', '#FF8C00', '#DC143C'],
      borderWidth: 1
    }]
  };

  // Daily Throughput Chart Data
  const throughputData = {
    labels: analytics.dailyThroughput?.map(d => new Date(d.date).toLocaleDateString()) || [],
    datasets: [{
      label: 'Batches Completed',
      data: analytics.dailyThroughput?.map(d => d.count) || [],
      fill: false,
      borderColor: '#228B22',
      backgroundColor: '#32CD32',
      tension: 0.1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    }
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <div className="time-range-selector">
          <label>Time Range:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: '#4682B4' }}>
            <span>📦</span>
          </div>
          <div className="metric-content">
            <h3>Total Batches</h3>
            <p className="metric-value">{analytics.totalBatches || 0}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: '#32CD32' }}>
            <span>✓</span>
          </div>
          <div className="metric-content">
            <h3>Completed</h3>
            <p className="metric-value">{analytics.completedBatches || 0}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: '#FFD700' }}>
            <span>⏳</span>
          </div>
          <div className="metric-content">
            <h3>In Progress</h3>
            <p className="metric-value">{analytics.inProgressBatches || 0}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: '#9370DB' }}>
            <span>⚖️</span>
          </div>
          <div className="metric-content">
            <h3>Total Weight</h3>
            <p className="metric-value">{analytics.totalWeight || 0}kg</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: '#FF8C00' }}>
            <span>⏱️</span>
          </div>
          <div className="metric-content">
            <h3>Avg. Processing Time</h3>
            <p className="metric-value">{analytics.averageCompletionTime || 0} days</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: '#DC143C' }}>
            <span>🔴</span>
          </div>
          <div className="metric-content">
            <h3>Delayed Batches</h3>
            <p className="metric-value">{analytics.delayedBatches || 0}</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Stage Distribution */}
        <div className="chart-card">
          <h3>Current Stage Distribution</h3>
          <div className="chart-container">
            <Pie data={stageDistributionData} options={chartOptions} />
          </div>
        </div>

        {/* Quality Distribution */}
        <div className="chart-card">
          <h3>Quality Distribution</h3>
          <div className="chart-container">
            <Pie data={qualityDistributionData} options={chartOptions} />
          </div>
        </div>

        {/* Processing Time by Stage */}
        <div className="chart-card chart-wide">
          <h3>Average Processing Time by Stage</h3>
          <div className="chart-container">
            <Bar data={processingTimeData} options={chartOptions} />
          </div>
        </div>

        {/* Daily Throughput */}
        <div className="chart-card chart-wide">
          <h3>Daily Throughput</h3>
          <div className="chart-container">
            <Line data={throughputData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Top Origins */}
      {analytics.topOrigins && analytics.topOrigins.length > 0 && (
        <div className="origins-section">
          <h3>Top Origins</h3>
          <div className="origins-list">
            {analytics.topOrigins.map((origin, index) => (
              <div key={index} className="origin-item">
                <div className="origin-rank">#{index + 1}</div>
                <div className="origin-name">{origin._id || 'Unknown'}</div>
                <div className="origin-count">{origin.count} batches</div>
                <div className="origin-weight">{origin.totalWeight}kg</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Insights */}
      <div className="insights-section">
        <h3>Performance Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Efficiency</h4>
            <p className="insight-metric">
              {analytics.completedBatches && analytics.totalBatches 
                ? ((analytics.completedBatches / analytics.totalBatches) * 100).toFixed(1)
                : 0}%
            </p>
            <p className="insight-label">Completion Rate</p>
          </div>

          <div className="insight-card">
            <h4>Quality</h4>
            <p className="insight-metric">
              {analytics.qualityDistribution?.Premium || 0}
            </p>
            <p className="insight-label">Premium Batches</p>
          </div>

          <div className="insight-card">
            <h4>Throughput</h4>
            <p className="insight-metric">
              {analytics.dailyThroughput?.length > 0
                ? (analytics.dailyThroughput.reduce((sum, d) => sum + d.count, 0) / analytics.dailyThroughput.length).toFixed(1)
                : 0}
            </p>
            <p className="insight-label">Avg. Daily Batches</p>
          </div>

          <div className="insight-card">
            <h4>Bottleneck</h4>
            <p className="insight-metric">
              {Object.keys(analytics.averageProcessingTime || {})
                .reduce((a, b) => analytics.averageProcessingTime[a] > analytics.averageProcessingTime[b] ? a : b, 'N/A')}
            </p>
            <p className="insight-label">Slowest Stage</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
