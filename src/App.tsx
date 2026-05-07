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
  Minus
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'meals' | 'finances' | 'reports' | 'extras' | 'more' | 'guestMeals'>('dashboard');
  const [moreActiveView, setMoreActiveView] = useState<'none' | 'reports' | 'extras' | 'guestMeals'>('none');
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        sharedExpenses: parsed.sharedExpenses || [],
        guestRecords: parsed.guestRecords || [],
      };
    }
    return {
      members: [],
      mealRecords: [],
      transactions: [],
      sharedExpenses: [],
      guestRecords: [],
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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

    return { 
      totalDeposits, 
      totalExpenses, 
      totalSharedExpenses,
      totalMeals, 
      totalRice, 
      balance: totalDeposits - totalExpenses - totalSharedExpenses 
    };
  }, [state]);

  const memberStats = useMemo(() => {
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
        cost: totalIndividualCost,
        mealCostOnly: cost,
        sharedCostShare: perMemberShared,
        deposited,
        expensePaid,
        balance: deposited - totalIndividualCost
      };
    });
  }, [state]);

  return (
    <div className="flex h-screen bg-slate-50/50 font-sans overflow-hidden flex-col lg:flex-row">
      {/* Sidebar Navigation - Hidden on mobile */}
      <aside className="w-56 bg-slate-900 text-white hidden lg:flex flex-col shrink-0">
        <div className="p-5 border-b border-white/5">
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-500 rounded flex items-center justify-center text-xs">M</div>
            মেস মাস্টার
          </h1>
          <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Ledger v2.1</p>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
          <SidebarLink active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard className="w-4 h-4" />} label="ড্যাশবোর্ড" />
          <SidebarLink active={activeTab === 'meals'} onClick={() => setActiveTab('meals')} icon={<UtensilsCrossed className="w-4 h-4" />} label="হাজিরা শীট" />
          <SidebarLink active={activeTab === 'finances'} onClick={() => setActiveTab('finances')} icon={<Wallet className="w-4 h-4" />} label="লেনদেন ও খরচ" />
          <SidebarLink active={activeTab === 'extras'} onClick={() => setActiveTab('extras')} icon={<Plus className="w-4 h-4" />} label="অন্যান্য খরচ" />
          <SidebarLink active={activeTab === 'members'} onClick={() => setActiveTab('members')} icon={<Users className="w-4 h-4" />} label="মেম্বার" />
          <SidebarLink active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<FileText className="w-4 h-4" />} label="রিপোর্ট" />
        </nav>

        <div className="p-3 mt-auto">
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
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-5 sm:px-6 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-slate-800 truncate">
              {activeTab === 'dashboard' && 'ড্যাশবোর্ড'}
              {activeTab === 'members' && 'মেম্বার তালিকা'}
              {activeTab === 'meals' && 'খাবার হাজিরা'}
              {activeTab === 'finances' && 'অর্থনৈতিক হিসাব'}
              {activeTab === 'extras' && 'অতিরিক্ত খরচ'}
              {activeTab === 'reports' && 'বিস্তারিত রিপোর্ট'}
            </h2>
          </div>
          
          <div className="flex gap-3">
            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-tight">
              <Calendar className="w-3 h-3" />
              <span className="hidden xs:inline">{formatDate(new Date().toISOString().split('T')[0])}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30">
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
                  <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <MetricCard title="মোট বাজার খরচ" amount={formatCurrency(totals.totalExpenses)} trendColor="text-rose-600" />
                    <MetricCard title="মোট অতিরিক্ত খরচ" amount={formatCurrency(totals.totalSharedExpenses)} trendColor="text-purple-600" />
                    <MetricCard title="মোট জমা" amount={formatCurrency(totals.totalDeposits)} trendColor="text-indigo-600" />
                    <MetricCard title="মোট খাবার" amount={`${totals.totalMeals} বার`} trendColor="text-amber-600" />
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="p-3 sm:p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tighter text-[11px]">
                        <Users className="w-3.5 h-3.5 text-indigo-500" /> মেম্বার স্ট্যাটাস
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left min-w-[500px]">
                        <thead className="bg-slate-50/50">
                          <tr>
                            <th className="px-4 py-3 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-tighter">নাম</th>
                            <th className="px-4 py-3 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-tighter text-center">খাবার ও চাল</th>
                            <th className="px-4 py-3 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-tighter text-center">মোট খরচ</th>
                            <th className="px-4 py-3 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-tighter text-center">মোট জমা</th>
                            <th className="px-4 py-3 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-tighter text-right">ব্যালেন্স</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {memberStats.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 font-semibold text-slate-700">{m.name}</td>
                              <td className="px-4 py-3 text-slate-600 text-center">
                                <div className="font-bold text-slate-800">{m.meals} বার</div>
                                <div className="text-[10px] text-orange-600 font-bold">{m.rice.toFixed(1)} পট চাল</div>
                              </td>
                              <td className="px-4 py-3 text-slate-600 text-center font-medium">{formatCurrency(m.cost)}</td>
                              <td className="px-4 py-3 text-slate-600 text-center font-medium">{formatCurrency(m.deposited)}</td>
                              <td className={`px-4 py-3 text-right font-bold ${m.balance >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {formatCurrency(m.balance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.section>
              )}

              {activeTab === 'members' && (
                <motion.section key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
                    <h2 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-tighter">নতুন মেম্বার</h2>
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
                      <input name="name" type="text" placeholder="পুরো নাম..." className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold focus:border-indigo-500 outline-none" required />
                      <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-xs hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-3.5 h-3.5" /> যোগ করুন
                      </button>
                    </form>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {state.members.map(m => (
                      <div key={m.id} className="bg-white p-3 rounded-lg flex items-center justify-between border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">{m.name[0]}</div>
                          <span className="font-bold text-slate-700 text-xs">{m.name}</span>
                        </div>
                        <button onClick={() => window.confirm(`${m.name}-কে মুছতে চান?`) && removeMember(m.id)} className="p-1.5 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
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
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/60">
        <h2 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-tighter">অতিরিক্ত খরচ (সবার ভাগ)</h2>
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
          <input name="amount" type="number" placeholder="টাকা" className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-bold outline-none focus:border-indigo-500" required />
          <input name="description" placeholder="বিবরণ (যেমন: ইন্টারনেট বিল)" className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-medium outline-none focus:border-indigo-500 sm:col-span-2" required />
          <button type="submit" className="bg-purple-600 text-white py-2 rounded-lg text-xs font-bold sm:col-span-3 hover:bg-purple-700 transition-colors">যোগ করুন</button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-[10px] font-bold text-slate-400">
          <span className="uppercase tracking-tighter">খরচ তালিকা</span>
          <span className="bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">SHARED</span>
        </div>
        <div className="divide-y divide-slate-100">
          {state.sharedExpenses.map(e => {
            const isEditing = editingId === e.id;
            return (
              <div key={e.id} className="p-3 hover:bg-slate-50/50 transition-colors">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                       <input 
                         type="number" 
                         value={editData.amount} 
                         onChange={ev => setEditData({...editData, amount: Number(ev.target.value)})}
                         className="bg-white border border-indigo-200 rounded-lg p-2 text-xs font-bold"
                       />
                       <input 
                         type="text" 
                         value={editData.description} 
                         onChange={ev => setEditData({...editData, description: ev.target.value})}
                         className="bg-white border border-indigo-200 rounded-lg p-2 text-xs font-medium"
                       />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          onUpdate(e.id, editData);
                          setEditingId(null);
                        }}
                        className="flex-1 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded"
                      >
                        আপডেট
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded"
                      >
                        বাতিল
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{e.description}</p>
                        <p className="text-[9px] text-slate-400 font-medium">{new Date(e.timestamp).toLocaleDateString('bn-BD')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xs font-black text-purple-600">-{formatCurrency(e.amount)}</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingId(e.id);
                            setEditData({ amount: e.amount, description: e.description });
                          }}
                          className="text-slate-300 hover:text-indigo-500 transition-colors"
                        >
                          <Plus className="w-4 h-4 rotate-45 scale-75" />
                        </button>
                        <button onClick={() => window.confirm('মুছতে চান?') && onRemove(e.id)} className="text-slate-300 hover:text-rose-500">
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
        <StatsCard label="গেস্ট মিল" value={`${state.guestRecords.length}`} color="orange" />
        <StatsCard label="গেস্ট খরচ" value={formatCurrency(state.guestRecords.reduce((acc, g) => acc + (g.breakfast ? MEAL_COSTS.BREAKFAST : 0) + (g.lunch ? MEAL_COSTS.LUNCH : 0) + (g.dinner ? MEAL_COSTS.DINNER : 0), 0))} color="emerald" />
        <StatsCard label="গেস্ট চাল" value="..." color="indigo" />
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tighter">গেস্ট মিল লিস্ট</h2>
          <button 
            onClick={() => {
              if (showAddForm) resetForm();
              setShowAddForm(!showAddForm);
            }} 
            className="text-[10px] bg-orange-600 text-white px-3 py-1.5 rounded-lg font-bold"
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
                <select value={formData.memberId} onChange={e => setFormData({...formData, memberId: e.target.value})} className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-semibold outline-none focus:border-orange-500" required>
                  <option value="">মেম্বার...</option>
                  {state.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <input type="text" value={formData.guestName} onChange={e => setFormData({...formData, guestName: e.target.value})} className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-medium outline-none focus:border-orange-500" placeholder="নাম..." />
                <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-bold outline-none focus:border-orange-500" />
                <div className="flex bg-slate-50 p-1 rounded-lg">
                  <MealPeriodToggle active={formData.breakfast} onClick={() => setFormData({...formData, breakfast: !formData.breakfast})} label="স" />
                  <MealPeriodToggle active={formData.lunch} onClick={() => setFormData({...formData, lunch: !formData.lunch})} label="দু" />
                  <MealPeriodToggle active={formData.dinner} onClick={() => setFormData({...formData, dinner: !formData.dinner})} label="রা" />
                </div>
              </div>
              <button type="submit" className="w-full py-2 bg-orange-600 text-white rounded-lg text-xs font-bold">
                {editingId ? 'আপডেট করুন' : 'সেভ করুন'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="divide-y divide-slate-100">
          {state.guestRecords.map(g => (
            <div key={g.id} className="p-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center"><UserPlus className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs font-bold text-slate-700">{g.guestName || 'Anonymous'}</p>
                  <p className="text-[9px] text-slate-400 font-medium">{state.members.find(m => m.id === g.memberId)?.name} • {formatDate(g.startDate)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(g)}
                  className="text-slate-300 hover:text-indigo-500"
                >
                  <Plus className="w-4 h-4 rotate-45 scale-75" />
                </button>
                <button onClick={() => onRemove(g.id)} className="text-slate-300 hover:text-rose-500">
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

function StatsCard({ label, value, color }: { label: string, value: string, color: string }) {
  const colors: any = { orange: 'bg-orange-50 text-orange-600 border-orange-100', emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100', indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
  return (
    <div className={`p-3 rounded-xl border flex flex-col items-center justify-center ${colors[color]}`}>
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
          ? 'bg-white shadow-sm text-orange-600' 
          : 'text-slate-400 hover:text-slate-600'
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
      className={`flex flex-col items-center justify-center gap-0.5 flex-1 transition-all ${
        active ? 'text-indigo-600' : 'text-slate-400'
      }`}
    >
      <div className="p-1">{icon}</div>
      <span className="text-[9px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function SidebarLink({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
        active 
          ? 'bg-indigo-600 text-white shadow-sm' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function MetricCard({ title, amount, trendColor }: { title: string, amount: string, trendColor: string }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">{title}</p>
      <h3 className="text-lg font-black text-slate-800 tracking-tight">{amount}</h3>
    </div>
  );
}

// Sub-components for better organization

function MealTracker({ state, onUpdate }: { state: AppState, onUpdate: any }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tighter">খাবার হাজিরা</h2>
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold focus:border-indigo-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200/60">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr className="text-slate-400 font-bold uppercase tracking-tighter">
                <th className="px-4 py-3 border-b border-slate-100">মেম্বার</th>
                <th className="px-4 py-3 border-b border-slate-100 text-center">সকাল</th>
                <th className="px-4 py-3 border-b border-slate-100 text-center">দুপুর</th>
                <th className="px-4 py-3 border-b border-slate-100 text-center">রাত</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.members.map(member => {
                const record = (state.mealRecords.find(r => r.date === date)?.members[member.id] || { breakfast: 0, lunch: 0, dinner: 0 }) as MealAttendance;
                return (
                  <tr key={member.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-700">{member.name}</td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={record.breakfast > 0} onChange={(e) => onUpdate(date, member.id, 'breakfast', e.target.checked ? 1 : 0)} className="w-4 h-4 accent-indigo-600 rounded" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={record.lunch > 0} onChange={(e) => onUpdate(date, member.id, 'lunch', e.target.checked ? 1 : 0)} className="w-4 h-4 accent-indigo-600 rounded" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={record.dinner > 0} onChange={(e) => onUpdate(date, member.id, 'dinner', e.target.checked ? 1 : 0)} className="w-4 h-4 accent-indigo-600 rounded" />
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

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
        <h2 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-tighter">নতুন এন্ট্রি</h2>
        
        <div className="flex bg-slate-50 p-1 rounded-lg mb-4">
          <button onClick={() => setType('DEPOSIT')} className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${type === 'DEPOSIT' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>জমা</button>
          <button onClick={() => setType('EXPENSE')} className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${type === 'EXPENSE' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-400'}`}>খরচ</button>
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
          <select name="memberId" className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-semibold outline-none focus:border-indigo-500" required>
            <option value="">মেম্বার...</option>
            {state.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <input name="amount" type="number" placeholder="টাকা" className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-bold outline-none focus:border-indigo-500" required />
          <input name="description" placeholder="বিস্তারিত..." className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-medium outline-none focus:border-indigo-500" required />
          <button type="submit" className={`sm:col-span-3 py-2.5 rounded-lg font-bold text-xs text-white transition-all ${type === 'DEPOSIT' ? 'bg-indigo-600' : 'bg-rose-600'}`}>সেভ করুন</button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
          <span>সাম্প্রতিক লেনদেন</span>
          <span className={totals.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}>ব্যালেন্স: {formatCurrency(totals.balance)}</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
          {state.transactions.map(t => {
            const isEditing = editingId === t.id;
            return (
              <div key={t.id} className="p-3 hover:bg-slate-50/50 transition-colors">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                       <select 
                         value={editData.memberId} 
                         onChange={ev => setEditData({...editData, memberId: ev.target.value})}
                         className="bg-white border border-indigo-200 rounded-lg p-2 text-xs font-semibold"
                       >
                         {state.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                       </select>
                       <input 
                         type="number" 
                         value={editData.amount} 
                         onChange={ev => setEditData({...editData, amount: Number(ev.target.value)})}
                         className="bg-white border border-indigo-200 rounded-lg p-2 text-xs font-bold"
                       />
                       <input 
                         type="text" 
                         value={editData.description} 
                         onChange={ev => setEditData({...editData, description: ev.target.value})}
                         className="bg-white border border-indigo-200 rounded-lg p-2 text-xs font-medium"
                       />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          onUpdate(t.id, editData);
                          setEditingId(null);
                        }}
                        className="flex-1 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded"
                      >
                        আপডেট
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded"
                      >
                        বাতিল
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{state.members.find(m => m.id === t.memberId)?.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium">{new Date(t.timestamp).toLocaleDateString('bn-BD')} • {t.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={`text-xs font-black ${t.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {t.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                      <button 
                        onClick={() => {
                          setEditingId(t.id);
                          setEditData({ amount: t.amount, description: t.description, memberId: t.memberId });
                        }}
                        className="text-slate-300 hover:text-indigo-500 transition-colors"
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
      <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-tighter whitespace-nowrap">রিপোর্ট দেখুন:</label>
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-500" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden min-h-[300px]">
        {filterDate ? (
          <div className="divide-y divide-slate-100">
            <div className="p-3 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              {formatDate(filterDate)} এর রিপোর্ট
            </div>
            {filteredRecords.length > 0 ? (
              filteredRecords[0].members && Object.entries(filteredRecords[0].members).map(([mId, attValue]) => {
                const att = attValue as MealAttendance;
                const member = state.members.find(m => m.id === mId);
                const cost = att.breakfast * MEAL_COSTS.BREAKFAST + att.lunch * MEAL_COSTS.LUNCH + att.dinner * MEAL_COSTS.DINNER;
                return (
                  <div key={mId} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-700">{member?.name}</p>
                      <div className="flex gap-1.5 mt-1 items-center">
                        {att.breakfast > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="সকাল"></span>}
                        {att.lunch > 0 && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" title="দুপুর"></span>}
                        {att.dinner > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" title="রাত"></span>}
                        <span className="text-[9px] text-slate-400 font-bold ml-1">
                          {(att.breakfast * RICE_POTS.BREAKFAST + att.lunch * RICE_POTS.LUNCH + att.dinner * RICE_POTS.DINNER).toFixed(1)} পট
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-800">{formatCurrency(cost)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center text-slate-300 italic text-sm">তথ্য পাওয়া যায়নি</div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <Search className="w-8 h-8 opacity-20 mb-2" />
            <p className="text-sm font-medium">তারিখ নির্বাচন করুন</p>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function MoreMenuButton({ onClick, icon, title, desc, color }: { onClick: () => void, icon: React.ReactNode, title: string, desc: string, color: string }) {
  const colorMap: any = {
    indigo: 'bg-indigo-50 text-indigo-600',
    rose: 'bg-rose-50 text-rose-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };
  
  return (
    <button 
      onClick={onClick}
      className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left flex items-start gap-4 group"
    >
      <div className={`p-3 rounded-lg transition-all group-hover:scale-105 ${colorMap[color] || 'bg-slate-50 text-slate-600'}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-800 mb-0.5">{title}</h3>
        <p className="text-[11px] text-slate-400 font-medium leading-tight">{desc}</p>
      </div>
    </button>
  );
}
