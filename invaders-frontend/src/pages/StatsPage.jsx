import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchFlashHistory, fetchLastFlashedInvaders } from '../services/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{`Semaine du : ${label}`}</p>
        <p className="intro" style={{ color: '#f09bdd' }}>{`Flashés cette semaine : ${payload[0].value}`}</p>
        <p className="desc" style={{ color: '#bb26b9' }}>{`Total cumulé : ${payload[1].value}`}</p>
      </div>
    );
  }
  return null;
};

function StatsPage() {
  const [chartData, setChartData] = useState([]);
  const [lastFlashedInvaders, setLastFlashedInvaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getData = async () => {
      try {
        const [historyData, lastInvaders] = await Promise.all([
          fetchFlashHistory(),
          fetchLastFlashedInvaders(6)
        ]);
        
        // Group data by week and calculate weekly totals
        const weeklyData = [];
        let currentWeekStart = null;
        let weeklyCount = 0;
        let lastCumulative = 0;
        
        historyData.forEach((item, index) => {
          const itemDate = new Date(item.date);
          const weekStart = new Date(itemDate);
          weekStart.setDate(itemDate.getDate() - itemDate.getDay()); // Start of week (Sunday)
          weekStart.setHours(0, 0, 0, 0);
          
          if (!currentWeekStart || weekStart.getTime() !== currentWeekStart.getTime()) {
            // New week started, save previous week if exists
            if (currentWeekStart) {
              weeklyData.push({
                date: currentWeekStart.toISOString(),
                displayDate: currentWeekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
                weekly: weeklyCount,
                cumulative: lastCumulative
              });
            }
            currentWeekStart = weekStart;
            weeklyCount = item.daily;
          } else {
            // Same week, add to weekly count
            weeklyCount += item.daily;
          }
          lastCumulative = item.cumulative;
          
          // Handle last item
          if (index === historyData.length - 1) {
            weeklyData.push({
              date: currentWeekStart.toISOString(),
              displayDate: currentWeekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
              weekly: weeklyCount,
              cumulative: lastCumulative
            });
          }
        });
        
        setChartData(weeklyData);
        setLastFlashedInvaders(lastInvaders);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    getData();
  }, []);

  if (isLoading) {
    return <div className="stats-page"><h1>Chargement des statistiques...</h1></div>;
  }

  if (error) {
    return <div className="stats-page"><h1>Erreur: {error}</h1></div>;
  }

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h1>Mes Statistiques de DINGUE</h1>
        <Link to="/" className="button">Retour à la carte</Link>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={500}>
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f09bdd" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#f09bdd" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#bb26b9" stopOpacity={0.7}/>
                <stop offset="95%" stopColor="#bb26b9" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(235, 224, 71, 0.2)" />
            <XAxis dataKey="displayDate" stroke="#ebe047" tick={{ fill: '#ebe047' }} />
            <YAxis stroke="#ebe047" tick={{ fill: '#ebe047' }} />
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: '1px solid #ebe047', borderRadius: '5px' }} />
            
            <Area
              type="monotone"
              dataKey="weekly"
              stroke="#f09bdd"
              fillOpacity={1}
              fill="url(#colorDaily)"
              name="Flashs par semaine"
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#ebe047"
              fillOpacity={1}
              fill="url(#colorCumulative)"
              name="Total cumulé"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {lastFlashedInvaders.length > 0 && (
        <div className="recent-invaders-section">
          <h2>Derniers Invaders Flashés</h2>
          <div className="recent-invaders-grid">
            {lastFlashedInvaders.map((invader) => (
              <div key={invader.id} className="invader-card">
                <div className="invader-image-container">
                  {invader.image_url ? (
                    <img 
                      src={invader.image_url} 
                      alt={`Invader ${invader.id}`}
                      className="invader-image"
                      onError={(e) => {
                        e.target.src = `/images/invaders_png/invader_${invader.id.split('_')[1] || '1'}.png`;
                      }}
                    />
                  ) : (
                    <img 
                      src={`/images/invaders_png/invader_${invader.id.split('_')[1] || '1'}.png`}
                      alt={`Invader ${invader.id}`}
                      className="invader-image"
                    />
                  )}
                </div>
                <div className="invader-id">{invader.id}</div>
                <div className="invader-date">
                  {new Date(invader.date_flash).toLocaleDateString('fr-FR', { 
                    day: '2-digit', 
                    month: 'short' 
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StatsPage;
