import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MessageSquare, FileText, Activity, Loader2 } from 'lucide-react';
import api from '../services/api';

const StatCard = ({ title, value, icon: Icon, trend, trendUp }: any) => (
  <div className="bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
    <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className="p-3 bg-white dark:bg-black rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 text-primary">
        <Icon size={24} />
      </div>
      <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${trendUp ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
        {trend}
      </div>
    </div>
    <div className="relative z-10">
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
    </div>
  </div>
);

const Analytics = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">Analytics Overview</h1>
        <p className="text-gray-500">Monitor your chatbot's performance, usage metrics, and document retrieval stats.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Chats" value={data?.total_chats || 0} icon={MessageSquare} trend="Real-time" trendUp={true} />
        <StatCard title="Total Messages" value={data?.total_messages || 0} icon={Activity} trend="Real-time" trendUp={true} />
        <StatCard title="Documents Uploaded" value={data?.total_documents || 0} icon={FileText} trend="Real-time" trendUp={true} />
      </div>

      <div className="bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm mb-8">
        <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Activity Over Time (Last 7 Days)</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.activity || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="text-gray-500" />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="text-gray-500" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(25, 25, 25, 0.9)', borderRadius: '12px', border: 'none', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" name="Messages" dataKey="queries" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorQueries)" />
              <Area type="monotone" name="Files" dataKey="documents" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorDocs)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
