import React, { useEffect, useState } from 'react';
import { LeaderboardEntry, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Trophy, User, Calendar, Hash } from 'lucide-react';

interface LeaderboardProps {
  lang: Language;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ lang }) => {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    fetch('/api/scores')
      .then(res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setScores(data);
        } else {
          console.error('Expected array of scores, got:', data);
          setScores([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch scores:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center p-4 opacity-50">{t.loading}</div>;
  }

  return (
    <div className="w-full mt-8 overflow-hidden rounded-xl border border-white/10 bg-black/20">
      <div className="p-4 border-bottom border-white/10 bg-white/5 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-500" />
        <h3 className="font-bold uppercase tracking-wider text-xs">{t.leaderboard}</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/5 text-zinc-500">
              <th className="p-3 font-medium flex items-center gap-1"><Hash className="w-3 h-3" /> {t.rank}</th>
              <th className="p-3 font-medium"><User className="w-3 h-3 inline mr-1" /> {t.name}</th>
              <th className="p-3 font-medium text-right"><Trophy className="w-3 h-3 inline mr-1" /> {t.score}</th>
              <th className="p-3 font-medium text-right"><Calendar className="w-3 h-3 inline mr-1" /> {t.date}</th>
            </tr>
          </thead>
          <tbody>
            {scores.length > 0 ? (
              scores.map((entry, index) => (
                <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-3 font-bold text-emerald-500">{index + 1}</td>
                  <td className="p-3 text-white">{entry.name}</td>
                  <td className="p-3 text-right font-mono text-emerald-400">{entry.score}</td>
                  <td className="p-3 text-right text-zinc-500">{entry.date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-8 text-center text-zinc-600 italic">No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
