import React, { useState, useEffect } from 'react';
import { Calendar, Plus, ExternalLink, Activity } from 'lucide-react';
import { googleSignIn, addEventToCalendar, getAccessToken, initAuth, logout } from '../googleCalendar';

export function CompromissosView({ clients }: { clients: any[] }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    client: '',
    date: '',
    time: '',
    description: '',
  });

  useEffect(() => {
    const unsub = initAuth(
      (user, t) => {
        setToken(t);
        setLoading(false);
      },
      () => {
        setToken(null);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleConnect = async () => {
    try {
      setLoading(true);
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
      }
    } catch (e: any) {
      alert('Erro ao conectar: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setLoading(true);
      const start = new Date(`${form.date}T${form.time}:00`);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration

      const summary = form.client ? `${form.title} - ${clients.find(c => c.id === form.client)?.nomeCompleto || 'Cliente'}` : form.title;

      await addEventToCalendar(token, summary, form.description, start, end);
      alert('Compromisso agendado com sucesso no Google Calendar!');
      setShowForm(false);
      setForm({
        title: '',
        client: '',
        date: '',
        time: '',
        description: '',
      });
    } catch (e: any) {
      alert('Erro ao agendar compromisso: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm">
        <Activity className="animate-spin text-yellow-500 mx-auto mb-4" size={32} />
        <p className="text-slate-500">Conectando ao Google...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="bg-yellow-50 p-8 rounded-xl border border-yellow-200 text-center max-w-xl mx-auto my-8">
        <Calendar className="mx-auto text-yellow-600 mb-4" size={48} />
        <h3 className="text-xl font-bold text-yellow-800 mb-2">Conecte seu Calendário</h3>
        <p className="text-yellow-700 mb-6">
          Integre com seu e-mail (Google Calendar) para marcar compromissos e agendamentos diretamente pela plataforma.
        </p>
        <button
          onClick={handleConnect}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors inline-flex items-center gap-2"
        >
          Conectar com o Google
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={24} className="text-yellow-500" />
            Seus Compromissos
          </h2>
          <p className="text-slate-500 text-sm mt-1">Conectado ao Google Calendar</p>
        </div>
        <div className="flex gap-2">
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            Abrir Agenda
            <ExternalLink size={16} />
          </a>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm text-sm font-semibold"
          >
            {showForm ? 'Cancelar' : <><Plus size={16} /> Novo Agendamento</>}
          </button>
        </div>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Marcar Novo Compromisso</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                placeholder="Ex: Reunião para Assinatura de Contrato"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Cliente Vinculado (Opcional)</label>
              <select
                value={form.client}
                onChange={e => setForm({...form, client: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
              >
                <option value="">Nenhum cliente específico</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nomeCompleto} - {c.cpf}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={e => setForm({...form, date: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hora Menor Prevista</label>
              <input
                type="time"
                required
                value={form.time}
                onChange={e => setForm({...form, time: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição / Detalhes</label>
              <textarea
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none min-h-[100px]"
                placeholder="Informações adicionais para o compromisso..."
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 px-6 py-2 rounded-lg font-bold transition-colors"
            >
              Confirmar e Salvar no Google
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-12">
          <Calendar size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-medium text-slate-700 mb-2">Google Calendar Conectado</h3>
          <p className="text-slate-500 mb-6">
            Você agora pode adicionar agendamentos e reuniões com seus clientes, e ele aparecerá lá no seu calendário do e-mail.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 px-6 py-3 rounded-lg font-bold transition-colors shadow-sm inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Agendar Compromisso
          </button>
          
          <div className="mt-6 pt-6 border-t border-slate-100">
             <button onClick={logout} className="text-sm text-red-500 hover:text-red-700">Desconectar Calendário</button>
          </div>
        </div>
      )}
    </div>
  );
}
