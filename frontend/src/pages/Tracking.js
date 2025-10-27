import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './Tracking.css';

const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');

function Tracking() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchBatches();

    // Socket.IO real-time updates
    socket.on('batchUpdate', (updatedBatch) => {
      setBatches(prevBatches => 
        prevBatches.map(batch => 
          batch._id === updatedBatch._id ? updatedBatch : batch
        )
      );
      if (selectedBatch && selectedBatch._id === updatedBatch._id) {
        setSelectedBatch(updatedBatch);
      }
    });

    socket.on('batchCreated', (newBatch) => {
      setBatches(prevBatches => [newBatch, ...prevBatches]);
    });

    socket.on('batchDeleted', (batchId) => {
      setBatches(prevBatches => prevBatches.filter(batch => batch._id !== batchId));
      if (selectedBatch && selectedBatch._id === batchId) {
        setSelectedBatch(null);
      }
    });

    return () => {
      socket.off('batchUpdate');
      socket.off('batchCreated');
      socket.off('batchDeleted');
    };
  }, [selectedBatch]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/batches`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch batches');
      const data = await response.json();
      setBatches(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBatchStage = async (batchId, newStage) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/batches/${batchId}/stage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ stage: newStage })
      });
      if (!response.ok) throw new Error('Failed to update stage');
      const updatedBatch = await response.json();
      // Socket.IO will handle the real-time update
    } catch (err) {
      setError(err.message);
    }
  };

  const addNote = async (batchId, note) => {
    if (!note.trim()) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/batches/${batchId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          note, 
          addedBy: user.name,
          timestamp: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error('Failed to add note');
      // Socket.IO will handle the real-time update
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.batchId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         batch.origin?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = filterStage === 'all' || batch.currentStage === filterStage;
    return matchesSearch && matchesStage;
  });

  const stages = ['Raw Wool', 'Sorting', 'Washing', 'Carding', 'Spinning', 'Dyeing', 'Quality Check', 'Packaging', 'Shipped'];

  const getStageColor = (stage) => {
    const colors = {
      'Raw Wool': '#8B4513',
      'Sorting': '#D2691E',
      'Washing': '#4682B4',
      'Carding': '#DEB887',
      'Spinning': '#FFD700',
      'Dyeing': '#9370DB',
      'Quality Check': '#32CD32',
      'Packaging': '#FF8C00',
      'Shipped': '#228B22'
    };
    return colors[stage] || '#808080';
  };

  return (
    <div className="tracking-container">
      <div className="tracking-header">
        <h1>Batch Tracking</h1>
        <div className="tracking-controls">
          <input
            type="text"
            placeholder="Search by Batch ID or Origin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select 
            value={filterStage} 
            onChange={(e) => setFilterStage(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Stages</option>
            {stages.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tracking-content">
        <div className="batches-list">
          <h2>Batches ({filteredBatches.length})</h2>
          {loading ? (
            <div className="loading">Loading batches...</div>
          ) : (
            <div className="batch-cards">
              {filteredBatches.map(batch => (
                <div 
                  key={batch._id}
                  className={`batch-card ${selectedBatch?._id === batch._id ? 'selected' : ''}`}
                  onClick={() => setSelectedBatch(batch)}
                >
                  <div className="batch-header">
                    <h3>{batch.batchId}</h3>
                    <span 
                      className="stage-badge"
                      style={{ backgroundColor: getStageColor(batch.currentStage) }}
                    >
                      {batch.currentStage}
                    </span>
                  </div>
                  <div className="batch-info">
                    <p><strong>Origin:</strong> {batch.origin}</p>
                    <p><strong>Weight:</strong> {batch.weight}kg</p>
                    <p><strong>Quality:</strong> {batch.quality}</p>
                  </div>
                  <div className="batch-timeline">
                    <div 
                      className="timeline-progress"
                      style={{ 
                        width: `${(stages.indexOf(batch.currentStage) + 1) / stages.length * 100}%`,
                        backgroundColor: getStageColor(batch.currentStage)
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedBatch && (
          <div className="batch-details">
            <div className="details-header">
              <h2>Batch Details: {selectedBatch.batchId}</h2>
              <button onClick={() => setSelectedBatch(null)} className="close-btn">×</button>
            </div>

            <div className="details-content">
              <div className="info-section">
                <h3>Basic Information</h3>
                <div className="info-grid">
                  <div><strong>Batch ID:</strong> {selectedBatch.batchId}</div>
                  <div><strong>Origin:</strong> {selectedBatch.origin}</div>
                  <div><strong>Weight:</strong> {selectedBatch.weight}kg</div>
                  <div><strong>Quality:</strong> {selectedBatch.quality}</div>
                  <div><strong>Created:</strong> {new Date(selectedBatch.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="stage-section">
                <h3>Current Stage: {selectedBatch.currentStage}</h3>
                {user && (user.role === 'admin' || user.role === 'processor') && (
                  <div className="stage-controls">
                    <label>Update Stage:</label>
                    <select 
                      onChange={(e) => updateBatchStage(selectedBatch._id, e.target.value)}
                      value={selectedBatch.currentStage}
                    >
                      {stages.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="history-section">
                <h3>Stage History</h3>
                <div className="history-timeline">
                  {selectedBatch.history && selectedBatch.history.map((entry, index) => (
                    <div key={index} className="history-entry">
                      <div 
                        className="history-marker"
                        style={{ backgroundColor: getStageColor(entry.stage) }}
                      ></div>
                      <div className="history-content">
                        <strong>{entry.stage}</strong>
                        <p>{new Date(entry.timestamp).toLocaleString()}</p>
                        <p className="history-user">By: {entry.updatedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="notes-section">
                <h3>Notes</h3>
                {user && (
                  <div className="add-note">
                    <input
                      type="text"
                      placeholder="Add a note..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addNote(selectedBatch._id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                )}
                <div className="notes-list">
                  {selectedBatch.notes && selectedBatch.notes.map((note, index) => (
                    <div key={index} className="note-item">
                      <p>{note.note}</p>
                      <small>{note.addedBy} - {new Date(note.timestamp).toLocaleString()}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tracking;
