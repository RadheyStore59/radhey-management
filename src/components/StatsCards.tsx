import React from 'react';
import { Lead } from '../types/lead';

interface StatsCardsProps {
  leads: Lead[];
}

export default function StatsCards({ leads }: StatsCardsProps) {
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'New').length,
    contacted: leads.filter(l => l.status === 'Contacted').length,
    qualified: leads.filter(l => l.status === 'Qualified').length,
    negotiation: leads.filter(l => l.status === 'Negotiation').length,
    won: leads.filter(l => l.status === 'Won').length,
    lost: leads.filter(l => l.status === 'Lost').length,
    todayFollowUps: leads.filter(l => {
      if (!l.last_follow_up) return false;
      const followUpDate = new Date(l.last_follow_up);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      return followUpDate <= twoDaysAgo;
    }).length,
  };

  const cards = [
    { title: 'Total Leads', value: stats.total, color: 'bg-slate-500' },
    { title: 'New Leads', value: stats.new, color: 'bg-blue-500' },
    { title: 'Qualified', value: stats.qualified, color: 'bg-yellow-500' },
    { title: 'Negotiation', value: stats.negotiation, color: 'bg-orange-500' },
    { title: 'Won', value: stats.won, color: 'bg-green-500' },
    { title: 'Lost', value: stats.lost, color: 'bg-red-400' },
    { title: 'Follow-ups Due', value: stats.todayFollowUps, color: 'bg-red-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div key={card.title} className="bg-white overflow-hidden shadow rounded-lg">
          <div className={`p-4 ${card.color}`}>
            <div className="text-white text-sm font-medium">{card.title}</div>
            <div className="text-white text-2xl font-bold">{card.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
