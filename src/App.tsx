/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  UtensilsCrossed, 
  Wallet, 
  FileText, 
  Plus, 
  Trash2, 
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  UserPlus,
  Minus,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Member, 
  DailyMealRecord, 
  Transaction, 
  AppState, 
  MEAL_COSTS, 
  RICE_POTS,
  TransactionType,
  MealAttendance,
  GuestRecord
} from './types';
import { STORAGE_KEY, BENGALI_MONTHS } from './constants';

const formatCurrency = (amount: number) => {
  return amount.toLocaleString('bn-BD') + ' ৳';
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate()} ${BENGALI_MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'meals' | 'finances' | 'reports' | 'extras' | 'more' | 'guestMeals' | 'rice'>('dashboard');
  const [moreActiveView, setMoreActiveView] = useState<'none' | 'reports' | 'extras' | 'guestMeals' | 'rice'>('none');
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        sharedExpenses: parsed.sharedExpenses || [],
        guestRecords: parsed.guestRecords || [],
        riceDeposits: parsed.riceDeposits || [],
      };
    }
    return {
      members: [],
      mealRecords: [],
      transactions: [],
      sharedExpenses: [],
      guestRecords: [],
      riceDeposits: [],
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    if (isDarkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // --- Actions ---
  const addMember = (name: string) => {
    if (!name.trim()) return;
    const newMember: Member = {
      id: crypto.randomUUID(),
      name,
      joinedAt: Date.now(),
    };
    setState(s => ({ ...s, members: [...s.members, newMember] }));
  };

  const removeMember = (id: string) => {
    setState(s => ({
      ...s,
      members: s.members.filter(m => m.id !== id),
      mealRecords: s.mealRecords.map(r => {
        const next = { ...r.members };
        delete next[id];
        return { ...r, members: next };
      }),
      transactions: s.transactions.filter(t => t.memberId !== id)
    }));
  };

  const updateMealAttendance = (date: string, memberId: string, meal: keyof MealAttendance, value: number) => {
    setState(s => {
      const records = [...s.mealRecords];
      let recordIndex = records.findIndex(r => r.date === date);
      
      if (recordIndex === -1) {
        const newRecord: DailyMealRecord = {
          date,
          members: {
            [memberId]: { breakfast: 0, lunch: 0, dinner: 0, [meal]: value }
          }
        };
        return { ...s, mealRecords: [...records, newRecord] };
      }

      const record = { ...records[recordIndex] };
      const memberRecord = { ...(record.members[memberId] || { breakfast: 0, lunch: 0, dinner: 0 }) };
      memberRecord[meal] = value;
      
      record.members = {
        ...record.members,
        [memberId]: memberRecord
      };
      
      records[recordIndex] = record;
      return { ...s, mealRecords: records };
    });
  };

  const addTransaction = (t: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTransaction: Transaction = {
      ...t,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setState(s => ({ ...s, transactions: [newTransaction, ...s.transactions] }));
  };

  const addSharedExpense = (amount: number, description: string) => {
    const newExpense = {
      id: crypto.randomUUID(),
      amount,
      description,
      timestamp: Date.now(),
    };
    setState(s => ({ ...s, sharedExpenses: [newExpense, ...s.sharedExpenses] }));
  };

  const removeSharedExpense = (id: string) => {
    setState(s => ({
      ...s,
      sharedExpenses: s.sharedExpenses.filter(e => e.id !== id)
    }));
  };

  const addGuestRecord = (guest: Omit<GuestRecord, 'id'>) => {
    const newRecord: GuestRecord = {
      ...guest,
      id: crypto.randomUUID(),
    };
    setState(s => ({ ...s, guestRecords: [...s.guestRecords, newRecord] }));
  };

  const removeGuestRecord = (id: string) => {
    setState(s => ({
      ...s,
      guestRecords: s.guestRecords.filter(g => g.id !== id)
    }));
  };

  const addRiceDeposit = (amount: number, memberId: string) => {
    const newDeposit = {
      id: crypto.randomUUID(),
      amount,
      memberId,
      timestamp: Date.now(),
    };
    setState(s => ({ ...s, riceDeposits: [newDeposit, ...s.riceDeposits] }));
  };

  const removeRiceDeposit = (id: string) => {
    setState(s => ({ ...s, riceDeposits: s.riceDeposits.filter(d => d.id !== id) }));
  };

  const updateRiceDeposit = (id: string, updates: { amount: number, memberId: string }) => {
    setState(s => ({
      ...s,
      riceDeposits: s.riceDeposits.map(d => d.id === id ? { ...d, ...updates } : d)
    }));
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setState(s => ({
      ...s,
      transactions: s.transactions.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const updateSharedExpense = (id: string, updates: { amount: number, description: string }) => {
    setState(s => ({
      ...s,
      sharedExpenses: s.sharedExpenses.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
  };

  const updateGuestRecord = (id: string, updates: Partial<GuestRecord>) => {
    setState(s => ({
      ...s,
      guestRecords: s.guestRecords.map(g => g.id === id ? { ...g, ...updates } : g)
    }));
  };

  // --- Calculations ---
  const totals = useMemo(() => {
    let totalDeposits = 0;
    let totalExpenses = 0;
    let totalMeals = 0;
    let totalRice = 0;

    state.transactions.forEach(t => {
      if (t.type === 'DEPOSIT') totalDeposits += t.amount;
      else totalExpenses += t.amount;
    });

    const totalSharedExpenses = state.sharedExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Sum member meals from mealRecords
    state.mealRecords.forEach(r => {
      Object.values(r.members).forEach((attValue) => {
        const att = attValue as MealAttendance;
        totalMeals += (att.breakfast + att.lunch + att.dinner);
        totalRice += (att.breakfast * RICE_POTS.BREAKFAST + att.lunch * RICE_POTS.LUNCH + att.dinner * RICE_POTS.DINNER);
      });
    });

    // Sum guest meals from guestRecords
    state.guestRecords.forEach(g => {
      const startDate = new Date(g.startDate);
      const endDate = new Date(g.endDate);
      
      const current = new Date(startDate);
      while (current <= endDate) {
        if (g.breakfast) {
          totalMeals += 1;
          totalRice += RICE_POTS.BREAKFAST;
          totalExpenses += MEAL_COSTS.BREAKFAST;
        }
        if (g.lunch) {
          totalMeals += 1;
          totalRice += RICE_POTS.LUNCH;
          totalExpenses += MEAL_COSTS.LUNCH;
        }
        if (g.dinner) {
          totalMeals += 1;
          totalRice += RICE_POTS.DINNER;
          totalExpenses += MEAL_COSTS.DINNER;
        }
        current.setDate(current.getDate() + 1);
      }
    });

    const totalRiceDeposited = state.riceDeposits.reduce((sum, d) => sum + d.amount, 0);

    return { 
      totalDeposits, 
      totalExpenses, 
      totalSharedExpenses,
      totalMeals, 
      totalRice, 
      totalRiceDeposited,
      riceStock: totalRiceDeposited - totalRice,
      balance: totalDeposits - totalExpenses - totalSharedExpenses 
    };
  }, [state]);

  const memberStatus = useMemo(() => {
    const totalShared = state.sharedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const perMemberShared = state.members.length > 0 ? totalShared / state.members.length : 0;

    return state.members.map(member => {
      let meals = 0;
      let rice = 0;
      let cost = 0;
      let deposited = 0;
      let expensePaid = 0;

      state.mealRecords.forEach(r => {
        const att = r.members[member.id] as MealAttendance | undefined;
        if (att) {
          meals += (att.breakfast + att.lunch + att.dinner);
          rice += (att.breakfast * RICE_POTS.BREAKFAST + att.lunch * RICE_POTS.LUNCH + att.dinner * RICE_POTS.DINNER);
          cost += (att.breakfast * MEAL_COSTS.BREAKFAST + att.lunch * MEAL_COSTS.LUNCH + att.dinner * MEAL_COSTS.DINNER);
        }
      });

      state.guestRecords.forEach(g => {
        if (g.memberId === member.id) {
          const startDate = new Date(g.startDate);
          const endDate = new Date(g.endDate);
          const current = new Date(startDate);
          
          while (current <= endDate) {
            if (g.breakfast) {
              meals += 1;
              rice += RICE_POTS.BREAKFAST;
              cost += MEAL_COSTS.BREAKFAST;
            }
            if (g.lunch) {
              meals += 1;
              rice += RICE_POTS.LUNCH;
              cost += MEAL_COSTS.LUNCH;
            }
            if (g.dinner) {
              meals += 1;
              rice += RICE_POTS.DINNER;
              cost += MEAL_COSTS.DINNER;
            }
            current.setDate(current.getDate() + 1);
          }
        }
      });

      // Calculate rice deposits per member
      const depositedRice = state.riceDeposits
        .filter(d => d.memberId === member.id)
        .reduce((sum, d) => sum + d.amount, 0);

      const riceBalance = depositedRice - rice;

      state.transactions.forEach(t => {
        if (t.memberId === member.id) {
          if (t.type === 'DEPOSIT') deposited += t.amount;
          else expensePaid += t.amount;
        }
      });

      const totalIndividualCost = cost + perMemberShared;

      return {
        ...member,
        meals,
        rice,
        depositedRice,
        riceBalance,
        cost: totalIndividualCost,
        deposited,
        expensePaid,
        balance: deposited - totalIndividualCost
      };
    });
  }, [state]);

  return (
    <div className={`flex h-screen overflow-hidden flex-col lg:flex-row relative ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-mesh">
        <div className="bg-blob bg-indigo-400/20 -top-24 -left-24"></div>
        <div className="bg-blob bg-purple-400/20 top-1/2 -right-24"></div>
        <div className="bg-blob bg-rose-400/20 -bottom-24 left-1/3"></div>
      </div>

      {/* Sidebar Navigation - Hidden on mobile */}
      <aside className="w-56 bg-slate-900/95 backdrop-blur-xl text-white hidden lg:flex flex-col shrink-0 z-10 border-r border-white/5">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-black tracking-tighter flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-xs shadow-lg shadow-indigo-500/20">M</div>
            Smart Mess
          </h1>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-black">MANAGER PRO</p>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
          <SidebarLink active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard className="w-4 h-4" />} label="ড্যাশবোর্ড" />
          <SidebarLink active={activeTab === 'meals'} onClick={() => setActiveTab('meals')} icon={<UtensilsCrossed className="w-4 h-4" />} label="হাজিরা শীট" />
          <SidebarLink active={activeTab === 'finances'} onClick={() => setActiveTab('finances')} icon={<Wallet className="w-4 h-4" />} label="লেনদেন ও খরচ" />
          <SidebarLink active={activeTab === 'extras'} onClick={() => setActiveTab('extras')} icon={<Plus className="w-4 h-4" />} label="অন্যান্য খরচ" />
          <SidebarLink active={activeTab === 'members'} onClick={() => setActiveTab('members')} icon={<Users className="w-4 h-4" />} label="মেম্বার" />
          <SidebarLink active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<FileText className="w-4 h-4" />} label="রিপোর্ট" />
        </nav>

        <div className="p-3 mt-auto space-y-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            {isDarkMode ? 'লাইট মোড' : 'ডার্ক মোড'}
          </button>

          <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
            <p className="text-[9px] uppercase text-slate-500 font-bold mb-1">স্ট্যাটাস</p>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400">লোকাল ক্যাশ সচল</span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden pb-16 lg:pb-0">
        {/* Top Header */}
        <header className="h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-white/5 flex items-center justify-between px-5 sm:px-6 shrink-0 relative z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              {activeTab === 'dashboard' && 'ড্যাশবোর্ড'}
              {activeTab === 'members' && 'মেম্বার তালিকা'}
              {activeTab === 'meals' && 'খাবার হাজিরা'}
              {activeTab === 'finances' && 'অর্থনৈতিক হিসাব'}
              {activeTab === 'extras' && 'অতিরিক্ত খরচ'}
              {activeTab === 'reports' && ' বিস্তারিত রিপোর্ট'}
              {activeTab === 'rice' && 'চালের হিসাব'}
              {activeTab === 'guestMeals' && 'গেস্ট মিল হিসাব'}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-tight">
              <Calendar className="w-3 h-3" />
              <span className="hidden xs:inline">{formatDate(new Date().toISOString().split('T')[0])}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30 dark:bg-slate-950/20 transition-colors duration-500">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.section 
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 sm:space-y-5"
                >
                  <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard title="মোট বাজার খরচ" amount={formatCurrency(totals.totalExpenses)} trendColor="text-rose-600" />
                    <MetricCard title="মোট অতিরিক্ত খরচ" amount={formatCurrency(totals.totalSharedExpenses)} trendColor="text-purple-600" />
                    <MetricCard title="মোট জমা" amount={formatCurrency(totals.totalDeposits)} trendColor="text-indigo-600" />
                    <MetricCard title="মোট খাবার" amount={`${totals.totalMeals} বার`} trendColor="text-amber-600" />
                    <MetricCard title="চালের স্টক" amount={`${totals.riceStock.toFixed(1)} পট`} trendColor={totals.riceStock < 10 ? "text-rose-600" : "text-emerald-600"} />
                  </div>

                  <div className="glass-card rounded-2xl overflow-hidden border border-white/40 dark:border-white/5 shadow-xl shadow-indigo-900/5">
                    <div className="p-4 sm:p-5 border-b border-slate-100/50 dark:border-white/5 flex justify-between items-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 uppercase tracking-tighter text-[11px]">
                        <Users className="w-4 h-4 text-indigo-500" /> মেম্বার স্ট্যাটাস
                      </h3>
                    </div>
                    <div className="overflow-x-auto scrollbar-hide">
                      <table className="w-full text-xs text-left min-w-[600px]">
                        <thead className="bg-slate-50/30 dark:bg-white/5">
                          <tr>
                            <th className="px-5 py-4 border-b border-slate-100/50 dark:border-white/5 text-slate-400 dark:text-slate-500 font-black uppercase tracking-tighter">নাম</th>
                            <th className="px-5 py-4 border-b border-slate-100/50 dark:border-white/5 text-slate-400 dark:text-slate-500 font-black uppercase tracking-tighter text-center">খাবার ও চাল</th>
                            <th className="px-5 py-4 border-b border-slate-100/50 dark:border-white/5 text-slate-400 dark:text-slate-500 font-black uppercase tracking-tighter text-center text-xs">চাল জমা ও বাকি</th>
                            <th className="px-5 py-4 border-b border-slate-100/50 dark:border-white/5 text-slate-400 dark:text-slate-500 font-black uppercase tracking-tighter text-center">মোট খরচ</th>
                            <th className="px-5 py-4 border-b border-slate-100/50 dark:border-white/5 text-slate-400 dark:text-slate-500 font-black uppercase tracking-tighter text-center">মোট জমা</th>
                            <th className="px-5 py-4 border-b border-slate-100/50 dark:border-white/5 text-slate-400 dark:text-slate-500 font-black uppercase tracking-tighter text-right">ব্যালেন্স</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50 dark:divide-white/5">
                          {memberStatus.map((m, idx) => (
                            <motion.tr 
                              key={m.id} 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 + idx * 0.05 }}
                              className="hover:bg-indigo-50/20 dark:hover:bg-white/5 transition-colors"
                            >
                              <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-200">{m.name}</td>
                              <td className="px-5 py-4 text-center">
                                <div className="font-bold text-slate-800 dark:text-slate-100">{m.meals} বার</div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-black">{m.rice.toFixed(1)} পট খরচ</div>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <div className="font-black text-emerald-600 dark:text-emerald-400">{m.depositedRice.toFixed(1)} পট</div>
                                <div className={`text-[10px] font-black px-1.5 py-0.5 rounded-full inline-block ${m.riceBalance >= 0 ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400'}`}>
                                  {m.riceBalance >= 0 ? `আছে: ${m.riceBalance.toFixed(1)}` : `বাকি: ${Math.abs(m.riceBalance).toFixed(1)}`}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-center text-slate-600 dark:text-slate-400 font-bold">{formatCurrency(m.cost)}</td>
                              <td className="px-5 py-4 text-center text-slate-600 dark:text-slate-400 font-bold">{formatCurrency(m.deposited)}</td>
                              <td className={`px-5 py-4 text-right ${m.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                <div className="font-black">{formatCurrency(m.balance)}</div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.section>
              )}

              {activeTab === 'members' && (
                <motion.section key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="glass-card p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm">
                    <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-tighter">নতুন মেম্বার</h2>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                        addMember(name);
                        form.reset();
                      }}
                      className="flex flex-col sm:flex-row gap-2"
                    >
                      <input name="name" type="text" placeholder="পুরো নাম..." className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-indigo-500 outline-none text-slate-800 dark:text-slate-100" required />
                      <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20">
                        <Plus className="w-3.5 h-3.5" /> যোগ করুন
                      </button>
                    </form>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {state.members.map(m => (
                      <div key={m.id} className="glass-card p-4 rounded-xl flex items-center justify-between border border-slate-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm">{m.name[0]}</div>
                          <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{m.name}</span>
                        </div>
                        <button 
                          onClick={() => {
                            if (window.confirm(`${m.name}-কে মুছতে চান?`)) {
                              removeMember(m.id);
                            }
                          }}
                          className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {activeTab === 'meals' && (
                <MealTracker state={state} onUpdate={updateMealAttendance} />
              )}

              {activeTab === 'finances' && (
                <FinanceTracker state={state} totals={totals} onAdd={addTransaction} onUpdate={updateTransaction} />
              )}

              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <button onClick={() => setActiveTab('more')} className="lg:hidden flex items-center gap-2 text-indigo-600 font-bold text-sm mb-4">
                    <ChevronLeft className="w-4 h-4" /> ফিরে যান
                  </button>
                  <ReportSection state={state} />
                </div>
              )}

              {activeTab === 'extras' && (
                <div className="space-y-6">
                  <button onClick={() => setActiveTab('more')} className="lg:hidden flex items-center gap-2 text-indigo-600 font-bold text-sm mb-4">
                    <ChevronLeft className="w-4 h-4" /> ফিরে যান
                  </button>
                  <SharedExpenseTracker state={state} onAdd={addSharedExpense} onRemove={removeSharedExpense} onUpdate={updateSharedExpense} />
                </div>
              )}

              {activeTab === 'guestMeals' && (
                <div className="space-y-6">
                  <button onClick={() => setActiveTab('more')} className="lg:hidden flex items-center gap-2 text-indigo-600 font-bold text-sm mb-4">
                    <ChevronLeft className="w-4 h-4" /> ফিরে যান
                  </button>
                  <GuestMealTracker state={state} onAdd={addGuestRecord} onRemove={removeGuestRecord} onUpdate={updateGuestRecord} />
                </div>
              )}

              {activeTab === 'rice' && (
                <div className="space-y-6">
                  <button onClick={() => setActiveTab('more')} className="lg:hidden flex items-center gap-2 text-indigo-600 font-bold text-sm mb-4">
                    <ChevronLeft className="w-4 h-4" /> ফিরে যান
                  </button>
                  <RiceTracker state={state} onAdd={addRiceDeposit} onRemove={removeRiceDeposit} onUpdate={updateRiceDeposit} totals={totals} />
                </div>
              )}

              {activeTab === 'more' && (
                <motion.section 
                  key="more-menu"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <MoreMenuButton 
                    onClick={() => setActiveTab('reports')}
                    icon={<FileText className="w-8 h-8" />}
                    title="ডিটেইলস রিপোর্ট"
                    desc="মেস মেম্বারদের সাপ্তাহিক ও মাসিক রিপোর্ট"
                    color="indigo"
                  />

                  <MoreMenuButton 
                    onClick={() => setActiveTab('extras')}
                    icon={<Plus className="w-8 h-8" />}
                    title="অন্যান্য (Shared) খরচ"
                    desc="ইন্টারনেট বিল, রুম ভাড়া ও যাবতীয় খরচ"
                    color="purple"
                  />

                  <MoreMenuButton 
                    onClick={() => setActiveTab('guestMeals')}
                    icon={<UserPlus className="w-8 h-8" />}
                    title="গেস্ট মিল ম্যানেজমেন্ট"
                    desc="মেম্বারদের অধীনস্থ গেস্ট মিলের হিসাব"
                    color="orange"
                  />

                  <MoreMenuButton 
                    onClick={() => setActiveTab('rice')}
                    icon={<UtensilsCrossed className="w-8 h-8" />}
                    title="চালের হিসাব"
                    desc="চালের স্টক ও জমা নেওয়ার হিসাব সিস্টেম"
                    color="emerald"
                  />
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200/60 flex lg:hidden items-center justify-around px-2 z-50 shadow-lg">
          <MobileNavLink active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard className="w-4 h-4" />} label="হোম" />
          <MobileNavLink active={activeTab === 'meals'} onClick={() => setActiveTab('meals')} icon={<UtensilsCrossed className="w-4 h-4" />} label="হাজিরা" />
          <MobileNavLink active={activeTab === 'finances'} onClick={() => setActiveTab('finances')} icon={<Wallet className="w-4 h-4" />} label="লেনদেন" />
          <MobileNavLink active={activeTab === 'members'} onClick={() => setActiveTab('members')} icon={<Users className="w-4 h-4" />} label="মেম্বার" />
          <MobileNavLink active={activeTab === 'more'} onClick={() => setActiveTab('more')} icon={<Menu className="w-4 h-4" />} label="মেনু" />
        </nav>
      </main>
    </div>
  );
}

function SharedExpenseTracker({ state, onAdd, onRemove, onUpdate }: { state: AppState, onAdd: (amount: number, desc: string) => void, onRemove: (id: string) => void, onUpdate: (id: string, updates: { amount: number, description: string }) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ amount: 0, description: '' });

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="glass-card p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-tighter">অতিরিক্ত খরচ (সবার ভাগ)</h2>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const amount = Number((form.elements.namedItem('amount') as HTMLInputElement).value);
            const desc = (form.elements.namedItem('description') as HTMLInputElement).value;
            onAdd(amount, desc);
            form.reset();
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <input name="amount" type="number" placeholder="টাকা" className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100" required />
          <input name="description" placeholder="বিবরণ (যেমন: ইন্টারনেট বিল)" className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-indigo-500 sm:col-span-2 text-slate-800 dark:text-slate-100" required />
          <button type="submit" className="bg-purple-600 text-white py-3 rounded-xl text-xs font-bold sm:col-span-3 hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20">যোগ করুন</button>
        </form>
      </div>

      <div className="glass-card rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500">
          <span className="uppercase tracking-tighter">খরচ তালিকা</span>
          <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full">SHARED</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {state.sharedExpenses.map(e => {
            const isEditing = editingId === e.id;
            return (
              <div key={e.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                       <input 
                         type="number" 
                         value={editData.amount} 
                         onChange={ev => setEditData({...editData, amount: Number(ev.target.value)})}
                         className="bg-white dark:bg-slate-800 border border-indigo-200 dark:border-white/10 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                       />
                       <input 
                         type="text" 
                         value={editData.description} 
                         onChange={ev => setEditData({...editData, description: ev.target.value})}
                         className="bg-white dark:bg-slate-800 border border-indigo-200 dark:border-white/10 rounded-xl p-2.5 text-xs font-medium text-slate-800 dark:text-slate-100"
                       />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          onUpdate(e.id, editData);
                          setEditingId(null);
                        }}
                        className="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-xl shadow-lg shadow-indigo-600/20"
                      >
                        আপডেট
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-xl"
                      >
                        বাতিল
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{e.description}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{new Date(e.timestamp).toLocaleDateString('bn-BD')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-black text-purple-600 dark:text-purple-400">-{formatCurrency(e.amount)}</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingId(e.id);
                            setEditData({ amount: e.amount, description: e.description });
                          }}
                          className="p-2 text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                        >
                          <Plus className="w-4 h-4 rotate-45 scale-75" />
                        </button>
                        <button onClick={() => { if(window.confirm('মুছতে চান?')) onRemove(e.id); }} className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

function GuestMealTracker({ state, onAdd, onRemove, onUpdate }: { state: AppState, onAdd: (g: Omit<GuestRecord, 'id'>) => void, onRemove: (id: string) => void, onUpdate: (id: string, updates: Partial<GuestRecord>) => void }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ memberId: '', guestName: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], breakfast: true, lunch: true, dinner: true });

  const guestStats = useMemo(() => {
    let totalRice = 0;
    let totalCost = 0;
    let totalMeals = 0;

    state.guestRecords.forEach(g => {
      const start = new Date(g.startDate);
      const end = new Date(g.endDate);
      const current = new Date(start);
      
      while (current <= end) {
        if (g.breakfast) {
          totalMeals++;
          totalRice += RICE_POTS.BREAKFAST;
          totalCost += MEAL_COSTS.BREAKFAST;
        }
        if (g.lunch) {
          totalMeals++;
          totalRice += RICE_POTS.LUNCH;
          totalCost += MEAL_COSTS.LUNCH;
        }
        if (g.dinner) {
          totalMeals++;
          totalRice += RICE_POTS.DINNER;
          totalCost += MEAL_COSTS.DINNER;
        }
        current.setDate(current.getDate() + 1);
      }
    });

    return { totalRice, totalCost, totalMeals };
  }, [state.guestRecords]);

  const resetForm = () => {
    setFormData({ memberId: '', guestName: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], breakfast: true, lunch: true, dinner: true });
    setEditingId(null);
  };

  const handleEdit = (g: GuestRecord) => {
    setFormData({ 
      memberId: g.memberId, 
      guestName: g.guestName, 
      startDate: g.startDate, 
      endDate: g.endDate, 
      breakfast: g.breakfast, 
      lunch: g.lunch, 
      dinner: g.dinner 
    });
    setEditingId(g.id);
    setShowAddForm(true);
  };

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatsCard label="গেস্ট মিল" value={`${guestStats.totalMeals}`} color="orange" />
        <StatsCard label="গেস্ট খরচ" value={formatCurrency(guestStats.totalCost)} color="emerald" />
        <StatsCard label="গেস্ট চাল" value={`${guestStats.totalRice.toFixed(1)} পট`} color="indigo" />
      </div>

      <div className="glass-card p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tighter">গেস্ট মিল লিস্ট</h2>
          <button 
            onClick={() => {
              if (showAddForm) resetForm();
              setShowAddForm(!showAddForm);
            }} 
            className="text-[10px] bg-orange-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-orange-600/20 transition-all hover:scale-105"
          >
            {showAddForm ? 'ফর্ম বন্ধ' : '+ নতুন গেস্ট'}
          </button>
        </div>

        <AnimatePresence>
          {showAddForm && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }} 
              className="overflow-hidden mb-6 space-y-3" 
              onSubmit={(e) => { 
                e.preventDefault(); 
                if (editingId) {
                  onUpdate(editingId, formData);
                } else {
                  onAdd(formData); 
                }
                setShowAddForm(false);
                resetForm();
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select value={formData.memberId} onChange={e => setFormData({...formData, memberId: e.target.value})} className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-orange-500 text-slate-800 dark:text-slate-100" required>
                  <option value="">মেম্বার...</option>
                  {state.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <input type="text" value={formData.guestName} onChange={e => setFormData({...formData, guestName: e.target.value})} className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-orange-500 text-slate-800 dark:text-slate-100" placeholder="নাম..." />
                <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-orange-500 text-slate-800 dark:text-slate-100" />
                <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-white/5">
                  <MealPeriodToggle active={formData.breakfast} onClick={() => setFormData({...formData, breakfast: !formData.breakfast})} label="স" />
                  <MealPeriodToggle active={formData.lunch} onClick={() => setFormData({...formData, lunch: !formData.lunch})} label="দু" />
                  <MealPeriodToggle active={formData.dinner} onClick={() => setFormData({...formData, dinner: !formData.dinner})} label="রা" />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/20">
                {editingId ? 'আপডেট করুন' : 'সেভ করুন'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {state.guestRecords.map(g => (
            <div key={g.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center"><UserPlus className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{g.guestName || 'Anonymous'}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{state.members.find(m => m.id === g.memberId)?.name} • {formatDate(g.startDate)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(g)}
                  className="p-2 text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                >
                  <Plus className="w-4 h-4 rotate-45 scale-75" />
                </button>
                <button onClick={() => { if(window.confirm('মুছতে চান?')) onRemove(g.id); }} className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function RiceTracker({ state, onAdd, onRemove, onUpdate, totals }: { state: AppState, onAdd: (amount: number, mId: string) => void, onRemove: (id: string) => void, onUpdate: (id: string, updates: { amount: number, memberId: string }) => void, totals: any }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ amount: 0, memberId: '' });

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatsCard label="মোট জমা চাল" value={`${totals.totalRiceDeposited.toFixed(1)} পট`} color="emerald" />
        <StatsCard label="ভোক্ত চাল" value={`${totals.totalRice.toFixed(1)} পট`} color="orange" />
      </div>

      <div className="glass-card p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-tighter">চাল জমা নিন</h2>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const amount = Number((form.elements.namedItem('amount') as HTMLInputElement).value);
            const mId = (form.elements.namedItem('memberId') as HTMLSelectElement).value;
            onAdd(amount, mId);
            form.reset();
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <select name="memberId" className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100" required>
            <option value="">মেম্বার...</option>
            {state.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <input name="amount" type="number" placeholder="পট সংখ্যা" className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100" required />
          <button type="submit" className="bg-emerald-600 text-white py-3 rounded-xl text-xs font-bold sm:col-span-1 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">জমা করুন</button>
        </form>
      </div>

      <div className="glass-card rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
          <span>চাল জমা দেওয়ার তালিকা</span>
          <span className={totals.riceStock < 10 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}>স্টক: {totals.riceStock.toFixed(1)} পট</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {state.riceDeposits.map(d => {
            const isEditing = editingId === d.id;
            const member = state.members.find(m => m.id === d.memberId);
            return (
              <div key={d.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                         value={editData.memberId} 
                         onChange={ev => setEditData({...editData, memberId: ev.target.value})}
                         className="bg-white dark:bg-slate-800 border border-indigo-200 dark:border-white/10 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100"
                       >
                         {state.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                       </select>
                       <input 
                         type="number" 
                         value={editData.amount} 
                         onChange={ev => setEditData({...editData, amount: Number(ev.target.value)})}
                         className="bg-white dark:bg-slate-800 border border-indigo-200 dark:border-white/10 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                       />
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => { onUpdate(d.id, editData); setEditingId(null); }} className="flex-1 py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-xl shadow-lg shadow-emerald-600/20">আপডেট</button>
                       <button onClick={() => setEditingId(null)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-xl">বাতিল</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <UtensilsCrossed className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{member?.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{new Date(d.timestamp).toLocaleDateString('bn-BD')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">+{d.amount} পট</p>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingId(d.id); setEditData({ amount: d.amount, memberId: d.memberId }); }} className="p-2 text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                          <Plus className="w-4 h-4 rotate-45 scale-75" />
                        </button>
                        <button onClick={() => { if(window.confirm('মুছতে চান?')) onRemove(d.id); }} className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

function StatsCard({ label, value, color }: { label: string, value: string, color: string }) {
  const colors: any = { 
    orange: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20', 
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20', 
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' 
  };
  return (
    <div className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 ${colors[color]}`}>
      <span className="text-[9px] font-bold uppercase tracking-tighter opacity-70">{label}</span>
      <span className="text-sm font-black">{value}</span>
    </div>
  );
}

function MealPeriodToggle({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
        active 
          ? 'bg-white dark:bg-slate-700 shadow-sm text-orange-600 dark:text-orange-400' 
          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
      }`}
    >
      {label}
    </button>
  );
}

function MobileNavLink({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-300 relative ${
        active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
      }`}
    >
      <div className={`p-1.5 rounded-lg transition-all duration-300 ${active ? 'bg-indigo-50 dark:bg-indigo-500/10 scale-110' : ''}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-tighter transition-all ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
      {active && (
        <motion.div 
          layoutId="mobile-indicator"
          className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400"
        />
      )}
    </button>
  );
}

function SidebarLink({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 group ${
        active 
          ? 'bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white shadow-lg shadow-indigo-600/20' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
      }`}
    >
      <div className={`transition-transform duration-300 group-hover:scale-110 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
        {icon}
      </div>
      <span className="tracking-tight">{label}</span>
    </button>
  );
}

function MetricCard({ title, amount, trendColor }: { title: string, amount: string, trendColor: string }) {
  // Map standard colors to dark mode variants
  const colorMap: any = {
    'text-rose-600': 'text-rose-600 dark:text-rose-400',
    'text-purple-600': 'text-purple-600 dark:text-purple-400',
    'text-indigo-600': 'text-indigo-600 dark:text-indigo-400',
    'text-amber-600': 'text-amber-600 dark:text-amber-400',
    'text-emerald-600': 'text-emerald-600 dark:text-emerald-400',
  };
  const colorClass = colorMap[trendColor] || trendColor;

  return (
    <div className="glass-card p-4 sm:p-5 rounded-2xl group hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between min-h-[90px]">
      <div>
        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-2">{title}</h4>
        <p className={`text-xl font-black tracking-tighter ${colorClass}`}>
          {amount}
        </p>
      </div>
      <div className="mt-auto pt-3">
        <div className={`h-1 rounded-full w-full bg-slate-100 dark:bg-slate-800 overflow-hidden`}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '60%' }}
            className={`h-full rounded-full transition-all duration-1000 bg-current opacity-20`}
          ></motion.div>
        </div>
      </div>
    </div>
  );
}

// Sub-components for better organization

function MealTracker({ state, onUpdate }: { state: AppState, onUpdate: any }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="glass-card p-4 rounded-xl shadow-sm border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tighter">খাবার হাজিরা</h2>
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-lg px-3 py-1.5 text-xs font-bold focus:border-indigo-500 outline-none text-slate-800 dark:text-slate-100"
        />
      </div>

      <div className="glass-card rounded-xl overflow-hidden shadow-sm border border-slate-200/60 dark:border-white/5">
        <div className="overflow-x-auto text-xs scrollbar-hide">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-white/5">
              <tr className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">
                <th className="px-4 py-3 border-b border-slate-100 dark:border-white/5">মেম্বার</th>
                <th className="px-4 py-3 border-b border-slate-100 dark:border-white/5 text-center">সকাল</th>
                <th className="px-4 py-3 border-b border-slate-100 dark:border-white/5 text-center">দুপুর</th>
                <th className="px-4 py-3 border-b border-slate-100 dark:border-white/5 text-center">রাত</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {state.members.map(member => {
                const record = (state.mealRecords.find(r => r.date === date)?.members[member.id] || { breakfast: 0, lunch: 0, dinner: 0 }) as MealAttendance;
                return (
                  <tr key={member.id} className="hover:bg-slate-50/30 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{member.name}</td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={record.breakfast > 0} onChange={(e) => onUpdate(date, member.id, 'breakfast', e.target.checked ? 1 : 0)} className="w-4 h-4 accent-indigo-600 rounded dark:bg-slate-800 dark:border-slate-700" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={record.lunch > 0} onChange={(e) => onUpdate(date, member.id, 'lunch', e.target.checked ? 1 : 0)} className="w-4 h-4 accent-indigo-600 rounded dark:bg-slate-800 dark:border-slate-700" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={record.dinner > 0} onChange={(e) => onUpdate(date, member.id, 'dinner', e.target.checked ? 1 : 0)} className="w-4 h-4 accent-indigo-600 rounded dark:bg-slate-800 dark:border-slate-700" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.section>
  );
}

function FinanceTracker({ state, totals, onAdd, onUpdate }: { state: AppState, totals: any, onAdd: any, onUpdate: (id: string, updates: Partial<Transaction>) => void }) {
  const [type, setType] = useState<TransactionType>('DEPOSIT');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ amount: 0, description: '', memberId: '' });

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DEPOSIT' | 'EXPENSE'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredTransactions = useMemo(() => {
    return state.transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMember = filterMember ? t.memberId === filterMember : true;
      const matchesType = filterType === 'ALL' ? true : t.type === filterType;
      
      const transactionDate = new Date(t.timestamp).toISOString().split('T')[0];
      const matchesStart = startDate ? transactionDate >= startDate : true;
      const matchesEnd = endDate ? transactionDate <= endDate : true;

      return matchesSearch && matchesMember && matchesType && matchesStart && matchesEnd;
    });
  }, [state.transactions, searchQuery, filterMember, filterType, startDate, endDate]);

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="glass-card p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-tighter">নতুন এন্ট্রি</h2>
        
        <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl mb-4">
          <button onClick={() => setType('DEPOSIT')} className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${type === 'DEPOSIT' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>জমা</button>
          <button onClick={() => setType('EXPENSE')} className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${type === 'EXPENSE' ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>খরচ</button>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const amount = Number((form.elements.namedItem('amount') as HTMLInputElement).value);
            const desc = (form.elements.namedItem('description') as HTMLInputElement).value;
            const mId = (form.elements.namedItem('memberId') as HTMLSelectElement).value;
            onAdd({ amount, description: desc, memberId: mId, type });
            form.reset();
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <select name="memberId" className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100" required>
            <option value="">মেম্বার...</option>
            {state.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <input name="amount" type="number" placeholder="টাকা" className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100" required />
          <input name="description" placeholder="বিস্তারিত..." className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100" required />
          <button type="submit" className={`sm:col-span-3 py-3 rounded-xl font-bold text-xs text-white transition-all shadow-lg ${type === 'DEPOSIT' ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-rose-600 shadow-rose-600/20'}`}>সেভ করুন</button>
        </form>
      </div>

      <div className="glass-card rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
          <span>সাম্প্রতিক লেনদেন</span>
          <span className={totals.balance >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}>ব্যালেন্স: {formatCurrency(totals.balance)}</span>
        </div>

        {/* Search and Filters Section */}
        <div className="p-4 bg-slate-50/30 dark:bg-white/5 border-b border-slate-100/50 dark:border-white/5 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="বর্ণনা দিয়ে খুঁজুন..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100"
            />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select 
              value={filterMember} 
              onChange={(e) => setFilterMember(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl px-2 py-2 text-[10px] font-bold outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
            >
              <option value="">সকল মেম্বার</option>
              {state.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>

            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl px-2 py-2 text-[10px] font-bold outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
            >
              <option value="ALL">সকল প্রকার</option>
              <option value="DEPOSIT">জমা</option>
              <option value="EXPENSE">খরচ</option>
            </select>

            <div className="relative">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl px-2 py-2 text-[9px] font-bold outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
              />
              {!startDate && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 pointer-events-none pr-4">শুরু</span>}
            </div>

            <div className="relative">
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl px-2 py-2 text-[9px] font-bold outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
              />
              {!endDate && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 pointer-events-none pr-4">শেষ</span>}
            </div>
          </div>
          
          {(searchQuery || filterMember || filterType !== 'ALL' || startDate || endDate) && (
            <div className="flex justify-between items-center pt-1">
              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                ফিল্টার অনুযায়ী {filteredTransactions.length}টি লেনদেন পাওয়া গেছে
              </p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setFilterMember('');
                  setFilterType('ALL');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-[9px] font-black text-rose-500 hover:underline uppercase tracking-tighter"
              >
                রিসেট করুন
              </button>
            </div>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 scrollbar-hide">
          {filteredTransactions.map(t => {
            const isEditing = editingId === t.id;
            return (
              <div key={t.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                       <select 
                         value={editData.memberId} 
                         onChange={ev => setEditData({...editData, memberId: ev.target.value})}
                         className="bg-white dark:bg-slate-800 border border-indigo-200 dark:border-white/10 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100"
                       >
                         {state.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                       </select>
                       <input 
                         type="number" 
                         value={editData.amount} 
                         onChange={ev => setEditData({...editData, amount: Number(ev.target.value)})}
                         className="bg-white dark:bg-slate-800 border border-indigo-200 dark:border-white/10 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                       />
                       <input 
                         type="text" 
                         value={editData.description} 
                         onChange={ev => setEditData({...editData, description: ev.target.value})}
                         className="bg-white dark:bg-slate-800 border border-indigo-200 dark:border-white/10 rounded-xl p-2.5 text-xs font-medium text-slate-800 dark:text-slate-100"
                       />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          onUpdate(t.id, editData);
                          setEditingId(null);
                        }}
                        className="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-xl shadow-lg shadow-indigo-600/20"
                      >
                        আপডেট
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-xl"
                      >
                        বাতিল
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${t.type === 'DEPOSIT' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{state.members.find(m => m.id === t.memberId)?.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{new Date(t.timestamp).toLocaleDateString('bn-BD')} • {t.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className={`text-sm font-black ${t.type === 'DEPOSIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                        {t.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                      <button 
                        onClick={() => {
                          setEditingId(t.id);
                          setEditData({ amount: t.amount, description: t.description, memberId: t.memberId });
                        }}
                        className="p-2 text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                      >
                        <Plus className="w-4 h-4 rotate-45 scale-75" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

function ReportSection({ state }: { state: AppState }) {
  const [filterDate, setFilterDate] = useState('');
  const filteredRecords = useMemo(() => filterDate ? state.mealRecords.filter(r => r.date === filterDate) : [], [state, filterDate]);

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="glass-card p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tighter whitespace-nowrap">রিপোর্ট দেখুন:</label>
        <input 
          type="date" 
          value={filterDate} 
          onChange={(e) => setFilterDate(e.target.value)} 
          className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100" 
        />
      </div>

      <div className="glass-card rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm overflow-hidden min-h-[300px]">
        {filterDate ? (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            <div className="p-3 bg-slate-50/50 dark:bg-white/5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
              {formatDate(filterDate)} এর রিপোর্ট
            </div>
            {filteredRecords.length > 0 ? (
              filteredRecords[0].members && Object.entries(filteredRecords[0].members).map(([mId, attValue]) => {
                const att = attValue as MealAttendance;
                const member = state.members.find(m => m.id === mId);
                const cost = att.breakfast * MEAL_COSTS.BREAKFAST + att.lunch * MEAL_COSTS.LUNCH + att.dinner * MEAL_COSTS.DINNER;
                return (
                  <div key={mId} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{member?.name}</p>
                      <div className="flex gap-1.5 mt-1 items-center">
                        {att.breakfast > 0 && <span className="w-2 h-2 rounded-full bg-amber-400" title="সকাল"></span>}
                        {att.lunch > 0 && <span className="w-2 h-2 rounded-full bg-indigo-400" title="দুপুর"></span>}
                        {att.dinner > 0 && <span className="w-2 h-2 rounded-full bg-rose-400" title="রাত"></span>}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold ml-1">
                          {(att.breakfast * RICE_POTS.BREAKFAST + att.lunch * RICE_POTS.LUNCH + att.dinner * RICE_POTS.DINNER).toFixed(1)} পট
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100">{formatCurrency(cost)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-24 text-center text-slate-300 dark:text-slate-600 italic text-sm">তথ্য পাওয়া যায়নি</div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300 dark:text-slate-600">
            <Search className="w-10 h-10 opacity-20 mb-3" />
            <p className="text-sm font-bold uppercase tracking-tighter">তারিখ নির্বাচন করুন</p>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function MoreMenuButton({ onClick, icon, title, desc, color }: { onClick: () => void, icon: React.ReactNode, title: string, desc: string, color: string }) {
  const colorMap: any = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
  };
  
  return (
    <button 
      onClick={onClick}
      className="glass-card p-5 rounded-2xl transition-all duration-300 text-left flex items-start gap-4 group hover:scale-[1.02] border-slate-200/60 dark:border-white/5 shadow-sm"
    >
      <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${colorMap[color] || 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-0.5">{title}</h3>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-tight">{desc}</p>
      </div>
    </button>
  );
}
