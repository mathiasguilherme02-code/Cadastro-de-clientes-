import React, { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { User, MapPin, FileText, Users, Camera, UploadCloud, CheckCircle2, LayoutDashboard, ArrowLeft, ArrowRight, Eye, ImageIcon, Download, Maximize, Minimize, Phone, Info, X, UserPlus, Calculator, Edit2, Save, Trash2, Calendar, TrendingUp, Plus, AlertCircle, LogOut, ArrowUpRight, ArrowDownRight, AlertTriangle, Wallet, PiggyBank, CreditCard, Activity, Clock, Search, Landmark, RefreshCw, Check, MessageCircle, Send, MessageSquare } from 'lucide-react';

const initialFormData = {
  nomeCompleto: '',
  nomeMae: '',
  cpf: '',
  rg: '',
  dataNascimento: '',
  telefone: '',
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  parenteNome: '',
  parenteGrau: '',
  parenteTelefone: '',
  parenteCep: '',
  parenteEndereco: '',
  parenteNumero: '',
  parenteComplemento: '',
  parenteBairro: '',
  parenteCidade: '',
  parenteEstado: '',
  quemIndicou: '',
  redesSociais: '',
  atividadeFinanceira: '',
  atividadeFinanceiraCep: '',
  atividadeFinanceiraEndereco: '',
  atividadeFinanceiraNumero: '',
  atividadeFinanceiraComplemento: '',
  atividadeFinanceiraBairro: '',
  atividadeFinanceiraCidade: '',
  atividadeFinanceiraEstado: '',
  observacoes: '',
  observacoesAdmin: '',
  statusManual: 'automatico'
};

const getLocalISODate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalISOMonth = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getLocalISOYear = (date = new Date()) => {
  return String(date.getFullYear());
};

const getLocalISODateTime = (date = new Date()) => {
  const d = getLocalISODate(date);
  const t = date.toTimeString().split(' ')[0];
  return `${d}T${t}`;
};

const parseLocalDate = (dateString: string) => {
  if (!dateString) return new Date();
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  return new Date(dateString);
};

const documentCategories = [
  { id: 'docFrente', label: 'CNH e/ou RG (Frente)', required: true },
  { id: 'docVerso', label: 'CNH e/ou RG (Verso)', required: true },
  { id: 'comprovante', label: 'Comprovante de Residência', required: true },
  { id: 'selfie', label: 'Selfie com Documento', required: true },
  { id: 'penhora', label: 'Penhora', required: true },
  { id: 'reserva1', label: 'Anexo Reserva 1', required: false },
  { id: 'reserva2', label: 'Anexo Reserva 2', required: false },
];

export default function App() {
  const [view, setView] = useState<'welcome' | 'simulation' | 'form' | 'admin_login' | 'admin' | 'client_login' | 'client_dashboard'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cliente') === 'true') return 'client_login';
    if (params.get('admin') === 'true') return 'admin_login';
    return 'welcome';
  });
  const [adminTab, setAdminTab] = useState<'clientes' | 'cronograma' | 'fluxo_caixa' | 'mensagens'>('clientes');
  const [cronogramaDate, setCronogramaDate] = useState(getLocalISODate());
  const [cronogramaYear, setCronogramaYear] = useState(getLocalISOYear());
  const [cronogramaMonth, setCronogramaMonth] = useState('all');
  const [cronogramaStatusFilter, setCronogramaStatusFilter] = useState('all');
  const [fluxoYear, setFluxoYear] = useState(getLocalISOYear()); // YYYY
  const [fluxoMonth, setFluxoMonth] = useState('all'); // 'all' or '01' to '12'
  const [fluxoTypeFilter, setFluxoTypeFilter] = useState('all'); // 'all', 'entrada', 'saida', 'retirada', 'aporte', 'entrada_prevista'
  const [newRetirada, setNewRetirada] = useState({ valor: '', descricao: '', data: getLocalISODate(), tipo: 'retirada' });
  
  const [adminPassword, setAdminPassword] = useState('');
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken') || '');
  const [loginError, setLoginError] = useState('');
  const [undoState, setUndoState] = useState<{ message: string; revertFn: () => Promise<void>; id: number; } | null>(null);

  const triggerUndo = (message: string, revertFn: () => Promise<void>) => {
    const id = Date.now();
    setUndoState({ message, revertFn, id });
    setTimeout(() => {
      setUndoState(current => {
        if (current?.id === id) return null;
        return current;
      });
    }, 10000); // 10 seconds to undo
  };

  const handleUndo = async () => {
    if (undoState) {
      try {
        await undoState.revertFn();
        setUndoState(null);
      } catch (e) {
        console.error('Erro ao desfazer operação:', e);
        alert('Erro ao desfazer operação.');
      }
    }
  };

  const updateClientWithUndo = async (updatedClient: any, actionName: string) => {
    const previousClientState = clients.find(c => c.id === updatedClient.id) || selectedClient;
    
    const headers: any = { 'Content-Type': 'application/json' };
    if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;

    try {
      const res = await fetch(`/api/clients/${updatedClient.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatedClient)
      });
      
      if (res.ok) {
        setSelectedClient(updatedClient);
        if (adminToken) {
          setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
        }
        
        triggerUndo(actionName, async () => {
          const revertRes = await fetch(`/api/clients/${previousClientState.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(previousClientState)
          });
          if (revertRes.ok) {
            setSelectedClient(previousClientState);
            if (adminToken) {
              setClients(clients.map(c => c.id === previousClientState.id ? previousClientState : c));
            }
          }
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error during ${actionName}:`, error);
      return false;
    }
  };

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem('adminToken', adminToken);
    } else {
      localStorage.removeItem('adminToken');
    }
  }, [adminToken]);
  const [clientCpf, setClientCpf] = useState('');
  const [clientLoginError, setClientLoginError] = useState('');
  const [clientActionMessage, setClientActionMessage] = useState('');
  const [clientActionError, setClientActionError] = useState('');
  const [showReprovadoAlert, setShowReprovadoAlert] = useState(false);
  const [showActiveLoanAlert, setShowActiveLoanAlert] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientToDelete, setClientToDelete] = useState<any | null>(null);
  const [isEditingClientData, setIsEditingClientData] = useState(false);
  const [editingParcela, setEditingParcela] = useState<{simIndex: number, parcelaIndex: number} | null>(null);
  const [editParcelaData, setEditParcelaData] = useState({dataVencimento: '', valor: 0, dataPagamento: ''});
  const [addingAbatimento, setAddingAbatimento] = useState<{simIndex: number, parcelaIndex: number} | null>(null);
  const [newAbatimento, setNewAbatimento] = useState({ data: '', valor: '' });

  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [editTransactionData, setEditTransactionData] = useState({ valor: '', descricao: '', data: '', tipo: '' });

  const [adminSettings, setAdminSettings] = useState({
    taxaJuros: '40',
    taxaAtrasoDia: '8',
    tipoTaxa: 'mensal'
  });

  const [simulacao, setSimulacao] = useState({
    valorSolicitado: '',
    prazo: 'mensal',
    quantidade: '1',
    taxaJuros: '40',
    taxaAtrasoDia: '8',
    tipoTaxa: 'mensal',
    dataVencimentoUnica: '',
    parcelas: [] as any[],
    isRenegociacao: false,
    renegociadoFromSimIndices: [] as number[]
  });
  const [editingSimIndex, setEditingSimIndex] = useState<number | null>(null);
  const [editSimData, setEditSimData] = useState({
    valorSolicitado: '',
    prazo: 'mensal',
    quantidade: '1',
    taxaJuros: '40',
    taxaAtrasoDia: '8',
    tipoTaxa: 'mensal',
    dataInicial: getLocalISODate(),
    dataVencimentoUnica: ''
  });

  // Chat State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [adminChats, setAdminChats] = useState<any[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isChatOpen]);

  const fetchChats = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/chats', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const chats = await res.json();
        setAdminChats(chats);
        const unread = chats.reduce((acc: number, chat: any) => acc + (chat.unreadAdmin || 0), 0);
        setUnreadChatCount(unread);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const fetchMessages = async (clientId: string) => {
    try {
      const res = await fetch(`/api/chat/${clientId}`);
      if (res.ok) {
        const messages = await res.json();
        setChatMessages(messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const markChatAsRead = async (clientId: string, reader: 'admin' | 'client') => {
    try {
      await fetch(`/api/chat/${clientId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reader })
      });
    } catch (error) {
      console.error("Error marking chat as read:", error);
    }
  };

  const deleteChat = async (clientId: string) => {
    if (!adminToken) return;
    
    const chatToRestore = adminChats.find(c => c.clientId === clientId);
    const messagesToRestore = [...chatMessages];

    try {
      const res = await fetch(`/api/chat/${clientId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setChatMessages([]);
        fetchChats();
        if (selectedClient && selectedClient.id === clientId) {
          setSelectedClient(null);
        }
        
        triggerUndo('Excluir Conversa', async () => {
          const revertRes = await fetch(`/api/chat/${clientId}/restore`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
              chatData: chatToRestore,
              messages: messagesToRestore
            })
          });
          if (revertRes.ok) {
            fetchChats();
            if (selectedClient && selectedClient.id === clientId) {
              fetchMessages(clientId);
            }
          }
        });
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const deleteMessage = async (clientId: string, messageId: string) => {
    if (!adminToken) return;
    
    const messageToRestore = chatMessages.find(m => m.id === messageId);

    try {
      const res = await fetch(`/api/chat/${clientId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setChatMessages(prev => prev.filter(msg => msg.id !== messageId));
        
        if (messageToRestore) {
          triggerUndo('Excluir Mensagem', async () => {
            const revertRes = await fetch(`/api/chat/${clientId}/messages/${messageId}/restore`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
              },
              body: JSON.stringify(messageToRestore)
            });
            if (revertRes.ok) {
              fetchMessages(clientId);
            }
          });
        }
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      try {
        const settingsRes = await fetch('/api/settings');
        
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setAdminSettings(settings);
        }

        if (adminToken) {
          const clientsRes = await fetch('/api/clients', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
          if (clientsRes.ok) {
            const clientsData = await clientsRes.json();
            setClients(clientsData);
          } else {
            setAdminToken('');
          }
          fetchChats();
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    };
    
    fetchData();

    // Setup SSE for real-time updates
    const eventSource = new EventSource('/api/events');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'UPDATE_SETTINGS') {
          fetchData();
        } else if (data.type === 'UPDATE_CLIENTS') {
          // We trigger a custom event that the rest of the app can listen to
          window.dispatchEvent(new CustomEvent('app:update_clients'));
        } else if (data.type === 'NEW_CLIENT') {
          if (adminToken) {
            toast.success(`Novo cliente cadastrado: ${data.payload?.nomeCompleto || 'Desconhecido'}`, {
              description: 'Um novo cadastro foi realizado no sistema.',
              duration: 5000,
            });
          }
        } else if (data.type === 'CHAT_UPDATE' || data.type === 'CHAT_READ') {
          window.dispatchEvent(new CustomEvent('app:chat_update', { detail: { ...data.payload, type: data.type } }));
        }
      } catch (e) {
        console.error("Error parsing SSE message:", e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [adminToken]);

  useEffect(() => {
    const handleChatUpdate = (e: any) => {
      const { clientId, type } = e.detail;
      if (adminToken) {
        fetchChats();
      }
      if (selectedClient && selectedClient.id === clientId) {
        fetchMessages(clientId);
        if (type === 'CHAT_UPDATE') {
          if (adminToken && adminTab === 'mensagens') {
            markChatAsRead(clientId, 'admin');
          } else if (!adminToken && isChatOpen) {
            markChatAsRead(clientId, 'client');
          }
        }
      }
    };

    window.addEventListener('app:chat_update', handleChatUpdate);
    return () => window.removeEventListener('app:chat_update', handleChatUpdate);
  }, [adminToken, selectedClient, isChatOpen, adminTab]);

  useEffect(() => {
    if (view === 'client_dashboard' && selectedClient) {
      fetchMessages(selectedClient.id);
    }
  }, [view, selectedClient]);

  const sendMessage = async (clientId: string, text: string, sender: 'admin' | 'client', clientName?: string) => {
    if (!text.trim()) return;
    try {
      const res = await fetch(`/api/chat/${clientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sender, clientName })
      });
      if (res.ok) {
        setChatInput('');
        fetchMessages(clientId);
        if (adminToken) fetchChats();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const [formData, setFormData] = useState(initialFormData);
  const [categorizedFiles, setCategorizedFiles] = useState<Record<string, File>>({});

  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingParenteCep, setLoadingParenteCep] = useState(false);
  const [loadingAtividadeCep, setLoadingAtividadeCep] = useState(false);
  const [cpfError, setCpfError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSimulationConfirmModal, setShowSimulationConfirmModal] = useState(false);
  const [pendingSimulation, setPendingSimulation] = useState<any>(null);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [showArchivedLoans, setShowArchivedLoans] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCepSearchModal, setShowCepSearchModal] = useState(false);
  const [cepSearchData, setCepSearchData] = useState({ uf: '', cidade: '', logradouro: '' });
  const [cepSearchResults, setCepSearchResults] = useState<any[]>([]);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepSearchError, setCepSearchError] = useState('');
  const [cepTarget, setCepTarget] = useState<'client' | 'parente' | 'atividadeFinanceira'>('client');
  const [printingSimIndex, setPrintingSimIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleUpdateClients = async () => {
      if (adminToken) {
        try {
          const clientsRes = await fetch('/api/clients', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
          if (clientsRes.ok) {
            const clientsData = await clientsRes.json();
            setClients(clientsData);
            
            // If a client is selected in admin view, update it too
            if (selectedClient && view === 'admin') {
              const updatedSelected = clientsData.find((c: any) => c.id === selectedClient.id);
              if (updatedSelected) {
                setSelectedClient(updatedSelected);
              }
            }
          }
        } catch (error) {
          console.error("Erro ao atualizar clientes:", error);
        }
      } else if (view === 'client_dashboard' && selectedClient?.cpf) {
        try {
          const res = await fetch('/api/clients/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpf: selectedClient.cpf })
          });
          if (res.ok) {
            const clientData = await res.json();
            
            const oldHasReprovado = (selectedClient.simulacoes || (selectedClient.simulacao ? [selectedClient.simulacao] : [])).some((s: any) => s.status === 'reprovado');
            const newHasReprovado = (clientData.simulacoes || (clientData.simulacao ? [clientData.simulacao] : [])).some((s: any) => s.status === 'reprovado');
            
            if (!oldHasReprovado && newHasReprovado) {
              setShowReprovadoAlert(true);
            }

            setSelectedClient(clientData);
          }
        } catch (error) {
          console.error("Erro ao atualizar dados do cliente:", error);
        }
      }
    };

    window.addEventListener('app:update_clients', handleUpdateClients);
    return () => {
      window.removeEventListener('app:update_clients', handleUpdateClients);
    };
  }, [adminToken, view, selectedClient]);

  const handleSearchCep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cepSearchData.uf.length !== 2 || cepSearchData.cidade.length < 3 || cepSearchData.logradouro.length < 3) {
      setCepSearchError('Preencha os campos corretamente (UF com 2 letras, Cidade e Rua com pelo menos 3 letras).');
      return;
    }
    
    setIsSearchingCep(true);
    setCepSearchError('');
    setCepSearchResults([]);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepSearchData.uf}/${cepSearchData.cidade}/${cepSearchData.logradouro}/json/`);
      const data = await response.json();
      
      if (data.erro || !Array.isArray(data) || data.length === 0) {
        setCepSearchError('Nenhum CEP encontrado com esses dados.');
      } else {
        setCepSearchResults(data);
      }
    } catch (error) {
      setCepSearchError('Erro ao buscar CEP. Tente novamente mais tarde.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleSelectCep = (address: any) => {
    if (cepTarget === 'client') {
      setFormData(prev => ({
        ...prev,
        cep: address.cep,
        endereco: address.logradouro,
        bairro: address.bairro,
        cidade: address.localidade,
        estado: address.uf
      }));
    } else if (cepTarget === 'parente') {
      setFormData(prev => ({
        ...prev,
        parenteCep: address.cep,
        parenteEndereco: address.logradouro,
        parenteBairro: address.bairro,
        parenteCidade: address.localidade,
        parenteEstado: address.uf
      }));
    } else if (cepTarget === 'atividadeFinanceira') {
      setFormData(prev => ({
        ...prev,
        atividadeFinanceiraCep: address.cep,
        atividadeFinanceiraEndereco: address.logradouro,
        atividadeFinanceiraBairro: address.bairro,
        atividadeFinanceiraCidade: address.localidade,
        atividadeFinanceiraEstado: address.uf
      }));
    }
    setShowCepSearchModal(false);
    setCepSearchResults([]);
    setCepSearchData({ uf: '', cidade: '', logradouro: '' });
  };

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        const docEl = document.documentElement as any;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch((err: any) => console.error(err));
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        } else if (docEl.msRequestFullscreen) {
          docEl.msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        const doc = document as any;
        if (doc.exitFullscreen) {
          doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        } else if (doc.msExitFullscreen) {
          doc.msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Erro no fullscreen:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const validateCPF = (cpf: string) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf === '') return false;
    if (cpf.length !== 11 ||
      cpf === "00000000000" ||
      cpf === "11111111111" ||
      cpf === "22222222222" ||
      cpf === "33333333333" ||
      cpf === "44444444444" ||
      cpf === "55555555555" ||
      cpf === "66666666666" ||
      cpf === "77777777777" ||
      cpf === "88888888888" ||
      cpf === "99999999999")
      return false;
    
    let add = 0;
    for (let i = 0; i < 9; i++)
      add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11)
      rev = 0;
    if (rev !== parseInt(cpf.charAt(9)))
      return false;
    
    add = 0;
    for (let i = 0; i < 10; i++)
      add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11)
      rev = 0;
    if (rev !== parseInt(cpf.charAt(10)))
      return false;
    return true;
  };

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const dateOnly = dateString.split('T')[0];
    const parts = dateOnly.split('-');
    if (parts.length === 3) {
      const date = parseLocalDate(dateOnly);
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
      const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      return `(${parts[2]}/${parts[1]}/${parts[0]}) - ${capitalizedDayName}`;
    }
    return dateString;
  };

  const getClientStatus = (client: any) => {
    if (client.statusManual && client.statusManual !== 'automatico') {
      return client.statusManual;
    }

    const clientSims = client.simulacoes?.filter((s: any) => ((s.status === 'aprovado' && s.clientAccepted !== 'nao') || !s.status) && !s.arquivado) || [];
    let worstStatus = 'sem_pendencias';

    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    for (const sim of clientSims) {
      for (const p of sim.parcelas) {
        if (!p.paga) {
          const vencimento = parseLocalDate(p.dataVencimento);
          vencimento.setHours(0,0,0,0);
          
          const diffTime = hoje.getTime() - vencimento.getTime();
          const diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diasAtraso > 60) {
            return 'inadimplente_antigo';
          } else if (diasAtraso > 30) {
            if (worstStatus !== 'inadimplente_antigo') worstStatus = 'muito_atrasado';
          } else if (diasAtraso > 0) {
            if (worstStatus !== 'inadimplente_antigo' && worstStatus !== 'muito_atrasado') worstStatus = 'atrasado';
          } else if (diasAtraso === 0) {
            if (worstStatus === 'sem_pendencias' || worstStatus === 'em_dia') worstStatus = 'vence_hoje';
          } else {
            if (worstStatus === 'sem_pendencias') worstStatus = 'em_dia';
          }
        }
      }
    }

    if (worstStatus === 'sem_pendencias') {
      const hasPendente = client.simulacoes?.some((s: any) => s.status === 'pendente' && !s.arquivado);
      if (hasPendente) return 'em_analise';

      const hasAguardandoAceite = client.simulacoes?.some((s: any) => 
        s.status === 'aprovado' && 
        s.clientAccepted !== 'sim' && 
        !s.arquivado &&
        !s.parcelas?.some((p: any) => p.paga)
      );
      if (hasAguardandoAceite) return 'aguardando_aceite';

      const hasReprovado = client.simulacoes?.some((s: any) => s.status === 'reprovado' && !s.arquivado);
      if (hasReprovado) return 'reprovado';
    }

    return worstStatus;
  };

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'inadimplente_antigo': return { color: 'bg-rose-900', text: 'text-white', label: 'Inadimplente Antigo' };
      case 'muito_atrasado': return { color: 'bg-red-900', text: 'text-white', label: '+30 Dias Atraso' };
      case 'atrasado': return { color: 'bg-red-500', text: 'text-white', label: 'Atrasado' };
      case 'vence_hoje': return { color: 'bg-yellow-400', text: 'text-yellow-900', label: 'Vence Hoje' };
      case 'em_dia': return { color: 'bg-emerald-500', text: 'text-white', label: 'Em Dia' };
      case 'em_analise': return { color: 'bg-yellow-400', text: 'text-yellow-900', label: 'Em Análise' };
      case 'aguardando_aceite': return { color: 'bg-blue-400', text: 'text-blue-900', label: 'Aguardando Aceite' };
      case 'reprovado': return { color: 'bg-red-500', text: 'text-white', label: 'Reprovado' };
      case 'sem_pendencias': return { color: 'bg-slate-200', text: 'text-slate-600', label: 'Sem Pendências' };
      default: return { color: 'bg-slate-200', text: 'text-slate-600', label: 'Sem Pendências' };
    }
  };

  const calcularSimulacao = () => {
    const valor = parseFloat(simulacao.valorSolicitado);
    if (!valor || isNaN(valor)) return;

    const qtd = simulacao.prazo === 'única' ? 1 : parseInt(simulacao.quantidade) || 1;
    const taxa = parseFloat(simulacao.taxaJuros) || parseFloat(adminSettings.taxaJuros) || 1;
    const isMensal = true; // Fixado mensalmente
    
    let diasTotais = 30;
    let dataAtual = new Date();
    dataAtual.setHours(0, 0, 0, 0);

    if (simulacao.prazo === 'dia') diasTotais = qtd;
    else if (simulacao.prazo === 'semanal') diasTotais = qtd * 7;
    else if (simulacao.prazo === 'quinzenal') diasTotais = qtd * 15;
    else if (simulacao.prazo === 'mensal') diasTotais = qtd * 30;
    else if (simulacao.prazo === 'única') {
      if (!simulacao.dataVencimentoUnica) {
        alert('Por favor, informe a data de pagamento para a parcela única.');
        return;
      }
      const dataVenc = parseLocalDate(simulacao.dataVencimentoUnica);
      dataVenc.setHours(0, 0, 0, 0);
      const diffTime = dataVenc.getTime() - dataAtual.getTime();
      diasTotais = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const fatorTempo = isMensal ? (diasTotais / 30) : diasTotais;
    const valorTotal = valor + (valor * (taxa / 100) * fatorTempo);
    const valorParcela = valorTotal / qtd;

    const novasParcelas = [];

    for (let i = 1; i <= qtd; i++) {
      let dataVencimento = new Date(dataAtual);
      if (simulacao.prazo === 'dia') {
        dataVencimento.setDate(dataVencimento.getDate() + i);
      } else if (simulacao.prazo === 'semanal') {
        dataVencimento.setDate(dataVencimento.getDate() + (i * 7));
      } else if (simulacao.prazo === 'quinzenal') {
        dataVencimento.setDate(dataVencimento.getDate() + (i * 15));
      } else if (simulacao.prazo === 'mensal') {
        dataVencimento.setMonth(dataVencimento.getMonth() + i);
      } else if (simulacao.prazo === 'única') {
        dataVencimento = parseLocalDate(simulacao.dataVencimentoUnica);
      }

      novasParcelas.push({
        numero: i,
        dataVencimento: getLocalISODate(dataVencimento),
        valor: valorParcela,
        paga: false
      });
    }

    setSimulacao(prev => ({ 
      ...prev, 
      taxaJuros: adminSettings.taxaJuros,
      taxaAtrasoDia: adminSettings.taxaAtrasoDia,
      tipoTaxa: adminSettings.tipoTaxa || 'diaria',
      parcelas: novasParcelas 
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    
    if (name === 'dataNascimento') {
      const digits = value.replace(/\D/g, '');
      if (digits.length <= 2) {
        formattedValue = digits;
      } else if (digits.length <= 4) {
        formattedValue = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      } else {
        formattedValue = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    if (name === 'cpf') {
      if (value.length >= 11) {
        if (!validateCPF(value)) {
          setCpfError('CPF inválido');
        } else {
          setCpfError('');
        }
      } else {
        setCpfError('');
      }
    }
  };

  const handleCategorizedFileChange = (categoryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert(`O arquivo ${file.name} é muito grande. O tamanho máximo é 10MB.`);
        e.target.value = '';
        return;
      }
      setCategorizedFiles(prev => ({ ...prev, [categoryId]: file }));
    }
  };

  const fetchAddress = async (cep: string, target: 'client' | 'parente' | 'atividadeFinanceira') => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    if (target === 'parente') setLoadingParenteCep(true);
    else if (target === 'atividadeFinanceira') setLoadingAtividadeCep(true);
    else setLoadingCep(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        if (target === 'parente') {
          setFormData(prev => ({
            ...prev,
            parenteEndereco: data.logradouro || '',
            parenteBairro: data.bairro || '',
            parenteCidade: data.localidade || '',
            parenteEstado: data.uf || ''
          }));
        } else if (target === 'atividadeFinanceira') {
          setFormData(prev => ({
            ...prev,
            atividadeFinanceiraEndereco: data.logradouro || '',
            atividadeFinanceiraBairro: data.bairro || '',
            atividadeFinanceiraCidade: data.localidade || '',
            atividadeFinanceiraEstado: data.uf || ''
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            endereco: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || ''
          }));
        }
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      if (target === 'parente') setLoadingParenteCep(false);
      else if (target === 'atividadeFinanceira') setLoadingAtividadeCep(false);
      else setLoadingCep(false);
    }
  };

  const handleCepBlur = (e: React.FocusEvent<HTMLInputElement>, target: 'client' | 'parente' | 'atividadeFinanceira') => {
    fetchAddress(e.target.value, target);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.cpf && !validateCPF(formData.cpf)) {
      setCpfError('Por favor, insira um CPF válido antes de continuar.');
      return;
    }

    if (!isEditingClientData) {
      const missingRequired = documentCategories.filter(cat => cat.required && !categorizedFiles[cat.id]);
      if (missingRequired.length > 0) {
        alert(`Por favor, envie os seguintes anexos obrigatórios:\n${missingRequired.map(c => `- ${c.label}`).join('\n')}`);
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      // Convert files to base64 for database storage
      const fileUrls: { name: string, url: string, type: string, categoria?: string }[] = [];
      const filesToProcess = Object.entries(categorizedFiles) as [string, File][];
      
    if (filesToProcess.length > 0) {
      let totalSize = 0;
      for (let i = 0; i < filesToProcess.length; i++) {
        totalSize += filesToProcess[i][1].size;
      }
      if (totalSize > 20 * 1024 * 1024) {
        alert("O tamanho total dos arquivos excede o limite de 20MB. Por favor, envie arquivos menores ou em menor quantidade.");
        setIsSubmitting(false);
        return;
      }

      for (let i = 0; i < filesToProcess.length; i++) {
        const [categoryId, file] = filesToProcess[i];
        const categoryLabel = documentCategories.find(c => c.id === categoryId)?.label || 'Outro';
        
        // Limit file size to 10MB
        if (file.size > 10 * 1024 * 1024) {
          alert(`O arquivo ${file.name} é muito grande. O tamanho máximo é 10MB.`);
          setIsSubmitting(false);
          return; // Stop submission
        }
        
        // Read file as base64 with compression for images to avoid large payloads
        const base64 = await new Promise<string>((resolve) => {
          if (!file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
            return;
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            if (file.type.startsWith('image/')) {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 800;

                if (width > height) {
                  if (width > maxDim) {
                    height *= maxDim / width;
                    width = maxDim;
                  }
                } else {
                  if (height > maxDim) {
                    width *= maxDim / height;
                    height = maxDim;
                  }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  resolve(canvas.toDataURL('image/jpeg', 0.6));
                } else {
                  resolve(e.target?.result as string);
                }
              };
              img.onerror = () => {
                resolve(e.target?.result as string);
              };
              img.src = e.target?.result as string;
            } else {
              resolve(e.target?.result as string);
            }
          };
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
        
        fileUrls.push({
          name: file.name,
          type: file.type,
          url: base64,
          categoria: categoryLabel
        });
      }
    }

    const generateUUID = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const newClient = isEditingClientData ? {
      ...selectedClient,
      ...formData,
      arquivos: fileUrls.length > 0 ? [...(formData.arquivos || []), ...fileUrls] : formData.arquivos
    } : {
      ...formData,
      id: generateUUID(),
      dataCadastro: getLocalISODateTime(),
      arquivos: fileUrls,
      simulacoes: simulacao.valorSolicitado ? [{ 
        ...simulacao, 
        status: adminToken ? 'aprovado' : 'pendente', 
        clientAccepted: adminToken ? 'sim' : undefined,
        dataCriacao: getLocalISODateTime() 
      }] : []
    };

    try {
      const payloadString = JSON.stringify(newClient);
      const payload = payloadString;
      
      const url = isEditingClientData ? `/api/clients/${selectedClient.id}` : '/api/clients';
      const method = isEditingClientData ? 'PUT' : 'POST';
      const headers: any = { 'Content-Type': 'application/json' };
      if (isEditingClientData && adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: payload
      });
      
      if (!response.ok) {
        let errorMsg = 'Erro desconhecido';
        try {
          const errorData = await response.json();
          const details = errorData.details ? JSON.stringify(errorData.details) : '';
          errorMsg = `${errorData.error} ${details}`;
        } catch (e) {
          errorMsg = `Status ${response.status}`;
        }
        alert(`Erro: ${errorMsg}`);
        setIsSubmitting(false);
        return;
      }
      
      if (isEditingClientData) {
        setClients(prev => prev.map(c => c.id === selectedClient.id ? newClient : c));
        setSelectedClient(newClient);
        setIsEditingClientData(false);
        setView('admin');
        alert('Dados do cliente atualizados com sucesso!');
      } else {
        setClients(prev => [newClient, ...prev]);
        setShowSuccessModal(true);
      }
      
      // Reset form
      setFormData(initialFormData);
      setCategorizedFiles({});
    } catch (error: any) {
      console.error("Erro ao salvar cliente:", error);
      alert(`Ocorreu um erro de conexão ao salvar o cadastro. Verifique sua internet ou tente novamente.`);
    } finally {
      setIsSubmitting(false);
    }
  } catch (error: any) {
    console.error("Erro ao processar arquivos:", error);
    alert(`Ocorreu um erro ao processar os arquivos. Tente enviar imagens menores.`);
    setIsSubmitting(false);
  }
};

  const calcularTotalAPagarAtualizado = (sim: any) => {
    let total = 0;
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    
    (sim.parcelas || []).forEach((p: any) => {
      if (!p.paga) {
        const vencimento = parseLocalDate(p.dataVencimento);
        vencimento.setHours(0,0,0,0);
        const isVencida = vencimento < hoje;
        let valorAtualizado = p.valor;
        const abatimentosTotal = p.abatimentos ? p.abatimentos.reduce((acc: number, a: any) => acc + a.valor, 0) : 0;
        
        if (isVencida) {
          let dataBase = hoje;
          if (p.jurosCongelados && p.dataCongelamento) {
            const dataCongelamento = parseLocalDate(p.dataCongelamento);
            dataCongelamento.setHours(0,0,0,0);
            if (dataCongelamento < hoje) {
              dataBase = dataCongelamento;
            }
          }
          const diffTime = Math.max(0, dataBase.getTime() - vencimento.getTime());
          const diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const taxaDia = parseFloat(sim.taxaAtrasoDia) || parseFloat(adminSettings.taxaAtrasoDia) || 1;
          valorAtualizado = p.valor + (p.valor * (taxaDia / 100) * diasAtraso);
        }
        valorAtualizado = Math.max(0, valorAtualizado - abatimentosTotal);
        total += valorAtualizado;
      }
    });
    return total;
  };

  const handleRenegociar = () => {
    if (!selectedClient) return;
    
    let totalOwed = 0;
    const activeLoanIndices: number[] = [];
    const clientSimulacoes = selectedClient.simulacoes || (selectedClient.simulacao ? [selectedClient.simulacao] : []);
    
    clientSimulacoes.forEach((sim: any, index: number) => {
      if ((sim.status === 'aprovado' || !sim.status) && sim.clientAccepted !== 'nao') {
        const simTotalOwed = calcularTotalAPagarAtualizado(sim);
        
        if (simTotalOwed > 0) {
          totalOwed += simTotalOwed;
          activeLoanIndices.push(index);
        }
      }
    });

    if (totalOwed <= 0) {
      alert('Não há saldo devedor para renegociar.');
      return;
    }

    setSimulacao({
      valorSolicitado: totalOwed.toFixed(2),
      prazo: 'única',
      quantidade: '1',
      dataVencimentoUnica: '',
      taxaJuros: adminSettings.taxaJuros,
      taxaAtrasoDia: adminSettings.taxaAtrasoDia,
      tipoTaxa: adminSettings.tipoTaxa || 'diaria',
      parcelas: [],
      valorTotal: 0,
      valorParcela: 0,
      isRenegociacao: true,
      renegociadoFromSimIndices: activeLoanIndices
    });
    setView('simulation');
  };

  const handleAddSimulation = async (simulacaoOverride?: any) => {
    if (!selectedClient) return;
    
    const simToUse = simulacaoOverride || simulacao;

    if (!adminToken) {
      const clientSimulacoes = selectedClient.simulacoes || (selectedClient.simulacao ? [selectedClient.simulacao] : []);
      const activeLoans = clientSimulacoes.filter((s: any) => ((s.status === 'aprovado' && s.clientAccepted !== 'nao') || !s.status) && !s.arquivado);
      const hasBlockingLoan = activeLoans.some((s: any) => {
        const unpaidCount = (s.parcelas || []).filter((p: any) => !p.paga).length;
        return unpaidCount > 2;
      });

      if (hasBlockingLoan) {
        setShowActiveLoanAlert(true);
        return;
      }
    }

    const clientSimulacoes = selectedClient.simulacoes || (selectedClient.simulacao ? [selectedClient.simulacao] : []);
    const novaSimulacao = { 
      ...simToUse, 
      status: adminToken ? 'aprovado' : 'pendente', 
      clientAccepted: adminToken ? 'sim' : undefined,
      dataCriacao: getLocalISODateTime() 
    };
    const updatedSimulacoes = [novaSimulacao, ...clientSimulacoes];
    
    if (simToUse.isRenegociacao && simToUse.renegociadoFromSimIndices && simToUse.renegociadoFromSimIndices.length > 0) {
      simToUse.renegociadoFromSimIndices.forEach((oldIndex: number) => {
        const adjustedIndex = oldIndex + 1;
        if (updatedSimulacoes[adjustedIndex]) {
          updatedSimulacoes[adjustedIndex] = {
            ...updatedSimulacoes[adjustedIndex],
            status: 'renegociado',
            arquivado: true,
            anotacoes: (updatedSimulacoes[adjustedIndex].anotacoes || '') + `\n[${getLocalISODateTime()}] Renegociado para um novo empréstimo.`
          };
        }
      });
    }
    
    const updatedClient = {
      ...selectedClient,
      simulacoes: updatedSimulacoes
    };
    
    try {
      const success = await updateClientWithUndo(updatedClient, 'Adicionar Empréstimo');
      
      if (!success) {
        alert('Erro ao adicionar empréstimo.');
        return;
      }
      
      // Update local state
      setClients(prev => prev.map(c => c.id === selectedClient.id ? updatedClient : c));
      setSelectedClient(updatedClient);
      if (adminToken) {
        setView('admin');
        setSelectedClient(null);
      } else {
        setView('client_dashboard');
      }
      alert('Novo empréstimo adicionado com sucesso!');
    } catch (error) {
      console.error("Erro ao adicionar empréstimo:", error);
      alert("Ocorreu um erro de conexão ao salvar o empréstimo.");
    }
  };

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/clients/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: clientCpf })
      });
      
      if (res.ok) {
        const clientData = await res.json();
        setSelectedClient(clientData);
        setClientLoginError('');
        setView('client_dashboard');
        
        const hasReprovado = (clientData.simulacoes || (clientData.simulacao ? [clientData.simulacao] : [])).some((s: any) => s.status === 'reprovado');
        if (hasReprovado) {
          setShowReprovadoAlert(true);
        }
      } else {
        setClientLoginError('CPF não encontrado em nossa base de dados.');
      }
    } catch (error) {
      setClientLoginError('Erro ao conectar com o servidor.');
    }
  };

  const handleClientAcceptance = async (simIndex: number, accepted: boolean) => {
    console.log("handleClientAcceptance called with:", { simIndex, accepted });
    setClientActionMessage('');
    setClientActionError('');
    
    if (!selectedClient) {
      console.error("Erro: Cliente não selecionado.");
      setClientActionError("Erro: Cliente não selecionado.");
      return;
    }
    if (simIndex === undefined || simIndex < 0) {
      console.error("Erro: Índice da simulação inválido.", simIndex);
      setClientActionError("Erro: Índice da simulação inválido.");
      return;
    }
    
    // Check if the simulation is actually approved before allowing acceptance
    const sim = selectedClient.simulacoes?.[simIndex] || (selectedClient.simulacao ? selectedClient.simulacao : null);
    if (!sim) {
      console.error("Erro: Simulação não encontrada.", simIndex);
      setClientActionError("Erro: Simulação não encontrada.");
      return;
    }
    if (sim.status && sim.status.toLowerCase().trim() !== 'aprovado') {
      console.error(`Erro: Simulação não está aprovada. Status atual: '${sim.status}'`);
      setClientActionError(`Erro: Simulação não está aprovada. Status atual: ${sim.status}`);
      return;
    }

    const updatedSimulacoes = selectedClient.simulacoes ? [...selectedClient.simulacoes] : [selectedClient.simulacao];
    updatedSimulacoes[simIndex] = { 
      ...updatedSimulacoes[simIndex], 
      clientAccepted: accepted ? 'sim' : 'nao' 
    };
    
    const updatedClient = { ...selectedClient, simulacoes: updatedSimulacoes };
    console.log("Sending updated client:", updatedClient);
    
    try {
      const res = await fetch(`/api/clients/${updatedClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedClient)
      });
      console.log("Fetch response status:", res.status);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("Fetch error data:", errData);
        throw new Error(errData.error || 'Failed to update client');
      }
      setSelectedClient(updatedClient);
      setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
      
      if (accepted) {
        setClientActionMessage('Caro cliente, agora vá até nosso WhatsApp, informe que concluiu e mande a chave do PIx');
      } else {
        setClientActionMessage('Caro cliente, lamentamos não poder atendê-lo, até uma próxima oportunidade');
      }
      
      console.log("Client acceptance updated successfully.");
    } catch (error: any) {
      console.error("Erro ao atualizar aceite do cliente:", error);
      setClientActionError(`Ocorreu um erro ao enviar sua resposta: ${error.message}`);
    }
  };

  const renderModals = () => (
    <>
      {/* Modals */}
      {showReprovadoAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setShowReprovadoAlert(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Aviso Importante</h3>
              <p className="text-slate-600 mb-6">
                Infelizmente, sua solicitação de empréstimo não foi aprovada neste momento.
                Entre em contato conosco para mais informações.
              </p>
              <button 
                onClick={() => setShowReprovadoAlert(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {showActiveLoanAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setShowActiveLoanAlert(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Aviso</h3>
              <p className="text-slate-600 mb-6">
                Caro cliente, você possui empréstimo ATIVO, com mais de duas parcelas a serem vencidas
              </p>
              <button 
                onClick={() => setShowActiveLoanAlert(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <Phone size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Fale conosco</h3>
              <p className="text-lg text-slate-600 mb-6">
                WhatsApp: <span className="font-bold text-slate-800">3197232-3040</span>
              </p>
              <button 
                onClick={() => setShowContactModal(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showHowItWorksModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowHowItWorksModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                <Info size={24} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Como funciona</h3>
            </div>
            
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                A GM-Empréstimo tem o prazer de tê-lo conosco. Vamos te informar como trabalhamos.
              </p>
              <p>
                Trabalhamos com juros ao seu alcance, com pagamento por dia, semanal, quinzenal e mensal.<br/>
                Porém, precisaremos saber e ter nossa garantia de que vamos receber nosso recurso aplicado.
              </p>
              <p>
                Então, o que vamos te emprestar, você tem que ter um bem, o dobro do valor emprestado, que vai ser nossa garantia, no caso de não serem efetuados os pagamentos, em data e valores corretos.
              </p>
              <p className="font-medium text-slate-800">
                Após o cadastro do cliente, você pode consultar seus empréstimos, através do campo, já sou cliente, digitando seu CPF para acessar.
              </p>
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg my-6">
                <p className="font-semibold text-red-800 mb-1">CASO:</p>
                <p className="text-red-700 mb-3">
                  ocorram atrasos, vamos penhorar esse bem, até que sejam normalizados os valores.
                </p>
                <p className="font-semibold text-red-800 mb-1">ATENÇÃO!</p>
                <p className="text-red-700 mb-3">
                  Em caso de atraso, serão cobrados juros de 8% ao dia. Os juros são atualizados diariamente e o novo valor será enviado via WhatsApp.
                </p>
                <p className="font-semibold text-red-800 mb-1">OBS:</p>
                <p className="text-red-700">
                  Somente após o pagamento de 40% da parcela em atraso, irá congelar os juros diários.
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="font-semibold text-yellow-800 mb-1">LEMBRETE:</p>
                <p className="text-yellow-700">
                  Todos os gastos de visitas e cobranças presenciais serão do cliente, por isso o pagamento deve ser realizado até as 18 horas via Pix, via motoboy até 17 horas.
                </p>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t">
              <button 
                onClick={() => setShowHowItWorksModal(false)}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {showCepSearchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl relative max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setShowCepSearchModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="text-yellow-500" />
              Buscar CEP por Endereço
            </h3>
            
            <form onSubmit={handleSearchCep} className="space-y-4 flex-shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">UF (Estado)</label>
                  <input 
                    type="text" 
                    maxLength={2}
                    value={cepSearchData.uf} 
                    onChange={(e) => setCepSearchData({...cepSearchData, uf: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none uppercase" 
                    placeholder="Ex: SP" 
                    required 
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                  <input 
                    type="text" 
                    value={cepSearchData.cidade} 
                    onChange={(e) => setCepSearchData({...cepSearchData, cidade: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none" 
                    placeholder="Ex: São Paulo" 
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rua / Avenida</label>
                <input 
                  type="text" 
                  value={cepSearchData.logradouro} 
                  onChange={(e) => setCepSearchData({...cepSearchData, logradouro: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none" 
                  placeholder="Ex: Paulista" 
                  required 
                />
              </div>
              
              {cepSearchError && <p className="text-red-500 text-sm">{cepSearchError}</p>}
              
              <button 
                type="submit" 
                disabled={isSearchingCep}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSearchingCep ? (
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Buscar CEP'
                )}
              </button>
            </form>

            {cepSearchResults.length > 0 && (
              <div className="mt-6 flex-1 overflow-y-auto min-h-0 border-t pt-4">
                <h4 className="font-medium text-slate-700 mb-3">Selecione o endereço correto:</h4>
                <div className="space-y-2">
                  {cepSearchResults.map((address, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectCep(address)}
                      className="w-full text-left p-3 border border-slate-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
                    >
                      <div className="font-semibold text-slate-800">{address.cep}</div>
                      <div className="text-sm text-slate-600">{address.logradouro}</div>
                      <div className="text-xs text-slate-500">{address.bairro} - {address.localidade}/{address.uf}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl relative text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Cadastro Concluído!</h3>
            <p className="text-slate-600 mb-8">
              Seu cadastro foi realizado com sucesso. Nossa equipe entrará em contato em breve.
            </p>
            <button 
              onClick={() => {
                setShowSuccessModal(false);
                setView('simulation');
              }}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Voltar para o Início
            </button>
          </div>
        </div>
      )}

      {showSimulationConfirmModal && pendingSimulation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center">Confirme sua Simulação</h3>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500">Valor Solicitado</span>
                <span className="font-bold text-slate-800 text-lg">{formatCurrency(pendingSimulation.valorSolicitado)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500">Prazo</span>
                <span className="font-semibold text-slate-800 capitalize">{pendingSimulation.prazo}</span>
              </div>
              {pendingSimulation.prazo !== 'única' ? (
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Quantidade de Parcelas</span>
                  <span className="font-semibold text-slate-800">{pendingSimulation.quantidade}x</span>
                </div>
              ) : (
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Data de Pagamento</span>
                  <span className="font-semibold text-slate-800">{formatDate(pendingSimulation.dataVencimentoUnica)}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-6 text-center">
              Confira os dados acima. Se estiver tudo certo, clique em Confirmar para enviar sua proposta.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowSimulationConfirmModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                Corrigir
              </button>
              <button 
                onClick={() => {
                  setShowSimulationConfirmModal(false);
                  if (selectedClient) {
                    handleAddSimulation(pendingSimulation);
                  } else {
                    setView('form');
                  }
                }}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (view === 'welcome') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 text-center">
          <div className="mx-auto w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-6">
            <Calculator size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Sistema de Empréstimos</h1>
          <p className="text-slate-600 mb-8">
            Bem-vindo! Clique no botão abaixo para acessar o sistema em tela cheia para a melhor experiência.
          </p>
          <button
            onClick={() => {
              toggleFullscreen();
              setView('simulation');
            }}
            className="w-full bg-yellow-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-yellow-600 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            Acessar Sistema
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  if (view === 'client_login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative">
        <button 
          onClick={() => setView('simulation')}
          className="absolute top-4 left-4 flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Área do Cliente</h2>
            <p className="text-slate-500">Acesse para ver a situação do seu empréstimo</p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleClientLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Seu CPF</label>
              <input
                type="text"
                required
                value={clientCpf}
                onChange={(e) => setClientCpf(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-slate-300 rounded-xl placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="000.000.000-00"
              />
            </div>
            {clientLoginError && (
              <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100">{clientLoginError}</p>
            )}
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors shadow-md"
            >
              Acessar meu painel
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'client_dashboard' && selectedClient) {
    const rawSimulacoes = selectedClient.simulacoes || (selectedClient.simulacao ? [selectedClient.simulacao] : []);
    const clientSimulacoes = rawSimulacoes
      .map((s: any, index: number) => ({ ...s, originalIndex: index }))
      .filter((s: any) => s && s.valorSolicitado);
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans relative">
        <div className="absolute top-4 left-4 flex gap-3">
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-2 bg-white text-slate-800 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
            title="Alternar Tela Cheia"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            {isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
          </button>
        </div>
        <div className="max-w-[95%] mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-slate-800">Olá, {selectedClient.nomeCompleto.split(' ')[0]}!</h1>
                {(() => {
                  const status = getClientStatus(selectedClient);
                  const statusDisplay = getStatusDisplay(status);
                  return (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.color} ${statusDisplay.text}`}>
                      {statusDisplay.label}
                    </span>
                  );
                })()}
              </div>
              <p className="text-slate-500">Acompanhe o histórico e situação dos seus empréstimos</p>
            </div>
            <div className="flex gap-3">
              {clientSimulacoes.some((s: any) => s.arquivado) && (
                <button
                  onClick={() => setShowArchivedLoans(!showArchivedLoans)}
                  className="flex items-center gap-2 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors shadow-sm font-medium"
                >
                  {showArchivedLoans ? 'Ocultar Arquivados' : 'Ver Arquivados'}
                </button>
              )}
              <button 
                onClick={() => {
                  const activeLoans = clientSimulacoes.filter((s: any) => ((s.status === 'aprovado' && s.clientAccepted !== 'nao') || !s.status) && !s.arquivado);
                  const hasBlockingLoan = activeLoans.some((s: any) => {
                    const unpaidCount = (s.parcelas || []).filter((p: any) => !p.paga).length;
                    return unpaidCount > 2;
                  });

                  if (hasBlockingLoan) {
                    setShowActiveLoanAlert(true);
                    return;
                  }

                  setSimulacao({
                    valorSolicitado: '',
                    prazo: 'mensal',
                    quantidade: '1',
                    parcelas: [],
                    taxaJuros: adminSettings.taxaJuros,
                    taxaAtrasoDia: adminSettings.taxaAtrasoDia,
                    tipoTaxa: adminSettings.tipoTaxa || 'diaria',
                    dataVencimentoUnica: '',
                    isRenegociacao: false,
                    renegociadoFromSimIndices: []
                  });
                  setView('simulation');
                }}
                className="flex items-center gap-2 bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm font-semibold"
              >
                Nova Simulação
              </button>
              <button 
                onClick={() => { setView('simulation'); setSelectedClient(null); setClientCpf(''); }}
                className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                Sair da Conta
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {clientSimulacoes.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Cadastro Enviado com Sucesso!</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Seu cadastro foi recebido por nossa equipe. Você pode fazer uma nova simulação de empréstimo clicando no botão acima.
                </p>
              </div>
            ) : (
              clientSimulacoes.map((sim: any, simIndex: number) => {
                if (sim.arquivado && !showArchivedLoans) return null;
                return (
              <div key={simIndex} className={`bg-white rounded-2xl shadow-xl overflow-hidden ${sim.arquivado ? 'opacity-75' : ''}`}>
                <div className={`${sim.arquivado ? 'bg-slate-500' : 'bg-yellow-500'} px-8 py-6 text-white flex justify-between items-center`}>
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      Empréstimo {clientSimulacoes.length > 1 ? `#${clientSimulacoes.length - simIndex}` : ''}
                      {sim.status === 'pendente' && <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full uppercase tracking-wider">Em Análise</span>}
                      {sim.status === 'reprovado' && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full uppercase tracking-wider">Reprovado</span>}
                      {sim.status === 'renegociado' && <span className="text-xs bg-slate-500 text-white px-2 py-1 rounded-full uppercase tracking-wider">Renegociado</span>}
                      {(sim.status === 'aprovado' || (!sim.status && sim.status !== 'renegociado')) && (
                        <>
                          <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full uppercase tracking-wider">Aprovado</span>
                          {sim.clientAccepted === 'sim' && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full uppercase tracking-wider ml-2">Aceito</span>}
                          {sim.clientAccepted === 'nao' && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full uppercase tracking-wider ml-2">Recusado</span>}
                        </>
                      )}
                      {sim.arquivado && <span className="text-xs bg-slate-700 text-white px-2 py-1 rounded-full uppercase tracking-wider">Arquivado</span>}
                    </h2>
                    <p className="text-yellow-100 mt-1">
                      Valor Solicitado: {formatCurrency(sim.valorSolicitado)}
                    </p>
                  </div>
                </div>
                
                <div className="p-8">
                  {sim.status === 'pendente' ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-4">
                        <FileText size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Em Análise</h3>
                      <p className="text-slate-500 max-w-md mx-auto">
                        Sua solicitação está sendo analisado e revisado pela nossa equipe, podendo ter alterações. Você poderá estar verificando se houve atualização.
                      </p>
                    </div>
                  ) : sim.status === 'reprovado' ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Solicitação Reprovada</h3>
                      <p className="text-slate-500 max-w-md mx-auto">
                        Infelizmente, sua solicitação de empréstimo não foi aprovada neste momento.
                        Entre em contato conosco para mais informações.
                      </p>
                    </div>
                  ) : (
                    <>
                      {sim.status === 'aprovado' && !sim.clientAccepted && !sim.parcelas?.some((p: any) => p.paga) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-center">
                          <h3 className="text-xl font-bold text-blue-800 mb-2">Proposta Aprovada!</h3>
                          <p className="text-blue-700 mb-4">
                            Sua simulação foi aprovada nas seguintes condições caso concorde ou não aperte abaixo da sua simulação SIM ou NÃO
                          </p>
                        </div>
                      )}
                      
                      {sim.status !== 'renegociado' && sim.clientAccepted === 'sim' && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8 text-center">
                          <h3 className="text-xl font-bold text-emerald-800 mb-2">Proposta Aceita!</h3>
                          <p className="text-emerald-700 font-medium">
                            Você aceitou esta proposta. Por favor, vá até nosso WhatsApp, informe que concluiu e mande a chave do PIx.
                          </p>
                        </div>
                      )}

                      {sim.status !== 'renegociado' && sim.clientAccepted === 'nao' && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 text-center">
                          <h3 className="text-xl font-bold text-red-800 mb-2">Proposta Recusada</h3>
                          <p className="text-red-700 font-medium">
                            Você recusou esta proposta. Lamentamos não poder atendê-lo, até uma próxima oportunidade.
                          </p>
                        </div>
                      )}

                      {sim.status === 'renegociado' && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 text-center">
                          <h3 className="text-xl font-bold text-slate-800 mb-2">Empréstimo Renegociado</h3>
                          <p className="text-slate-600 font-medium">
                            Este empréstimo foi renegociado e substituído por um novo contrato.
                          </p>
                        </div>
                      )}

                      <h3 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2 flex items-center gap-2">
                        <FileText size={20} className="text-yellow-500" />
                        Suas Parcelas
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-4">
                    {sim.parcelas.map((p: any, i: number) => {
                      const hoje = new Date();
                      hoje.setHours(0,0,0,0);
                      const vencimento = parseLocalDate(p.dataVencimento);
                      vencimento.setHours(0,0,0,0);
                      
                      const isVencida = !p.paga && vencimento < hoje;
                      const isVencendoHoje = !p.paga && vencimento.getTime() === hoje.getTime();
                      let diasAtraso = 0;
                      let valorAtualizado = p.valor;
                      const abatimentosTotal = p.abatimentos ? p.abatimentos.reduce((acc: number, a: any) => acc + a.valor, 0) : 0;
                      
                      if (isVencida) {
                        let dataBase = hoje;
                        if (p.jurosCongelados && p.dataCongelamento) {
                          const dataCongelamento = parseLocalDate(p.dataCongelamento);
                          dataCongelamento.setHours(0,0,0,0);
                          if (dataCongelamento < hoje) {
                            dataBase = dataCongelamento;
                          }
                        }
                        const diffTime = Math.max(0, dataBase.getTime() - vencimento.getTime());
                        diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const taxaDia = parseFloat(sim.taxaAtrasoDia) || 1;
                        valorAtualizado = p.valor + (p.valor * (taxaDia / 100) * diasAtraso);
                      }
                      
                      valorAtualizado = Math.max(0, valorAtualizado - abatimentosTotal);

                      return (
                        <div key={i} className={`border-2 rounded-xl p-5 ${isVencida ? 'border-red-400 bg-red-50 shadow-sm' : p.paga ? 'border-emerald-200 bg-emerald-50' : isVencendoHoje ? 'border-yellow-400 bg-yellow-50 shadow-sm' : 'border-slate-200 bg-white'}`}>
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg text-slate-800">Parcela {p.numero}</span>
                              {isVencendoHoje && (
                                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded animate-pulse">
                                  VENCE HOJE
                                </span>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${isVencida ? 'bg-red-100 text-red-700' : p.paga ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {isVencida ? 'VENCIDA' : p.paga ? 'PAGA' : 'PENDENTE'}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Vencimento:</span> 
                              <span className="font-medium text-slate-700">{formatDate(p.dataVencimento)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Valor Original:</span> 
                              <span className="font-medium text-slate-700">{formatCurrency(p.valor)}</span>
                            </div>
                          </div>

                          {p.abatimentos && p.abatimentos.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <h5 className="text-sm font-semibold text-slate-700 mb-2">Abatimentos Realizados</h5>
                              <div className="space-y-1 mb-2">
                                {p.abatimentos.map((abatimento: any, aIdx: number) => (
                                  <div key={aIdx} className="flex justify-between text-xs text-slate-600 bg-slate-50 p-1.5 rounded">
                                    <span>{formatDate(abatimento.data)}</span>
                                    <span className="font-medium text-emerald-600">{formatCurrency(abatimento.valor)}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between text-xs font-semibold text-slate-700 pt-1 border-t border-slate-200 mt-1">
                                  <span>Total Abatido:</span>
                                  <span className="text-emerald-600">{formatCurrency(p.abatimentos.reduce((acc: number, a: any) => acc + a.valor, 0))}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-slate-800 pt-1">
                                  <span>Restante:</span>
                                  <span>{formatCurrency(valorAtualizado)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {isVencida && (
                            <div className="mt-4 pt-4 border-t border-red-200">
                              <div className="text-red-600 font-bold mb-2 flex items-center gap-1">
                                ⚠️ Atenção: Parcela em Atraso
                              </div>
                              <div className="bg-white rounded-lg p-3 border border-red-100">
                                <div className="flex justify-between text-sm text-red-800 mb-1">
                                  <span>Dias de atraso:</span>
                                  <span className="font-semibold">{diasAtraso} dias</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-red-700 mt-2 pt-2 border-t border-red-100">
                                  <span>Valor Atualizado:</span>
                                  <span>{formatCurrency(valorAtualizado)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {clientActionMessage && (
                    <div className={`mt-4 p-4 rounded-xl flex items-center gap-2 border ${
                      clientActionMessage.includes('lamentamos') 
                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}>
                      {clientActionMessage.includes('lamentamos') ? <Info size={20} /> : <CheckCircle2 size={20} />}
                      <p>{clientActionMessage}</p>
                    </div>
                  )}
                  {clientActionError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
                      <AlertCircle size={20} />
                      <p>{clientActionError}</p>
                    </div>
                  )}
                  
                  {sim.status === 'aprovado' && !sim.clientAccepted && !sim.parcelas?.some((p: any) => p.paga) && (
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            handleClientAcceptance(sim.originalIndex, true);
                          }}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-6 rounded-xl shadow-md transition-colors text-lg"
                        >
                          SIM (Aceitar Proposta)
                        </button>
                        <button
                          onClick={() => {
                            handleClientAcceptance(sim.originalIndex, false);
                          }}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl shadow-md transition-colors text-lg"
                        >
                          NÃO (Recusar Proposta)
                        </button>
                      </div>
                    </div>
                  )}
                  </>
                  )}
                </div>
              </div>
              );
            }))}
          </div>
        </div>

        {/* Client Chat UI */}
        <div className="fixed bottom-6 right-6 z-50">
          {!isChatOpen ? (
            <button
              onClick={() => {
                setIsChatOpen(true);
                fetchMessages(selectedClient.id);
                markChatAsRead(selectedClient.id, 'client');
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 relative"
            >
              <MessageCircle size={28} />
              {chatMessages.some(m => m.sender === 'admin' && !m.read) && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                  {chatMessages.filter(m => m.sender === 'admin' && !m.read).length}
                </span>
              )}
            </button>
          ) : (
            <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 h-[500px] flex flex-col border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5">
              <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MessageSquare size={20} className="text-yellow-400" />
                  <h3 className="font-bold">Suporte</h3>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-slate-300 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-slate-500 my-auto">
                    <MessageCircle size={48} className="mx-auto text-slate-300 mb-2" />
                    <p>Envie uma mensagem para nossa equipe de suporte.</p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col max-w-[85%] ${msg.sender === 'client' ? 'self-end items-end' : 'self-start items-start'}`}>
                      <div className={`px-4 py-2 rounded-2xl ${msg.sender === 'client' ? 'bg-yellow-500 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              
              <div className="p-3 bg-white border-t border-slate-200">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage(selectedClient.id, chatInput, 'client', selectedClient.nomeCompleto);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                  />
                  <button 
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-slate-300 text-white p-2 rounded-full transition-colors flex-shrink-0"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {renderModals()}
        {undoState && (
          <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
            <div className="flex flex-col">
              <span className="font-medium">{undoState.message}</span>
              <span className="text-sm text-slate-400">Operação realizada com sucesso.</span>
            </div>
            <button
              onClick={handleUndo}
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-2 px-4 rounded-lg transition-colors whitespace-nowrap"
            >
              Desfazer
            </button>
            <button
              onClick={() => setUndoState(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>
        )}
      </div>
    );
  }

  const handleAddAbatimento = async (simIndex: number, parcelaIndex: number) => {
    if (!newAbatimento.data || !newAbatimento.valor) {
      alert('Preencha a data e o valor do abatimento.');
      return;
    }

    const valorNum = parseFloat(newAbatimento.valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      alert('Valor inválido.');
      return;
    }

    const updatedClients = clients.map(c => {
      if (c.id === selectedClient.id) {
        const updatedSimulacoes = [...c.simulacoes];
        const novasParcelas = [...updatedSimulacoes[simIndex].parcelas];
        
        const abatimentos = novasParcelas[parcelaIndex].abatimentos || [];
        
        novasParcelas[parcelaIndex] = {
          ...novasParcelas[parcelaIndex],
          abatimentos: [...abatimentos, { data: newAbatimento.data, valor: valorNum }]
        };
        
        updatedSimulacoes[simIndex] = { ...updatedSimulacoes[simIndex], parcelas: novasParcelas };
        
        const updatedClient = { ...c, simulacoes: updatedSimulacoes };
        
        // Save to API
        updateClientWithUndo(updatedClient, 'Adicionar Abatimento');
        return updatedClient;
      }
      return c;
    });
    
    setClients(updatedClients);
    setAddingAbatimento(null);
    setNewAbatimento({ data: '', valor: '' });
  };

  const handleRemoveAbatimento = async (simIndex: number, parcelaIndex: number, abatimentoIndex: number) => {
    if (!confirm('Tem certeza que deseja remover este abatimento?')) return;

    const updatedClients = clients.map(c => {
      if (c.id === selectedClient.id) {
        const updatedSimulacoes = [...c.simulacoes];
        const novasParcelas = [...updatedSimulacoes[simIndex].parcelas];
        
        const abatimentos = [...(novasParcelas[parcelaIndex].abatimentos || [])];
        abatimentos.splice(abatimentoIndex, 1);
        
        novasParcelas[parcelaIndex] = {
          ...novasParcelas[parcelaIndex],
          abatimentos
        };
        
        updatedSimulacoes[simIndex] = { ...updatedSimulacoes[simIndex], parcelas: novasParcelas };
        
        const updatedClient = { ...c, simulacoes: updatedSimulacoes };
        
        // Save to API
        updateClientWithUndo(updatedClient, 'Remover Abatimento');
        return updatedClient;
      }
      return c;
    });
    
    setClients(updatedClients);
  };

  const handleDeleteClient = async (id: string) => {
    const clientToDeleteData = clients.find(c => c.id === id);
    if (!clientToDeleteData) return;

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (res.ok) {
        setClients(clients.filter(c => c.id !== id));
        setClientToDelete(null);
        if (selectedClient && selectedClient.id === id) {
          setSelectedClient(null);
        }
        
        triggerUndo('Excluir Cliente', async () => {
          const revertRes = await fetch(`/api/clients/${id}/restore`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(clientToDeleteData)
          });
          if (revertRes.ok) {
            setClients([...clients, clientToDeleteData]);
          }
        });
      } else {
        alert('Erro ao excluir cliente.');
      }
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      alert('Erro ao excluir cliente.');
    }
  };

  if (view === 'admin_login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
          <div className="text-center mb-8">
            <LayoutDashboard size={48} className="mx-auto text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-800">Acesso Restrito</h2>
            <p className="text-slate-500 mt-2">Digite a senha para acessar o painel do administrador.</p>
          </div>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: adminPassword })
              });
              
              if (res.ok) {
                const { token } = await res.json();
                setAdminToken(token);
                
                // Fetch clients now that we have the token
                const clientsRes = await fetch('/api/clients', {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (clientsRes.ok) {
                  const clientsData = await clientsRes.json();
                  setClients(clientsData);
                }
                
                setView('admin');
                setAdminPassword('');
                setLoginError('');
              } else {
                setLoginError('Senha incorreta. Tente novamente.');
              }
            } catch (error) {
              setLoginError('Erro ao conectar com o servidor.');
            }
          }} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input 
                type="password" 
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    try {
                      const res = await fetch('/api/admin/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password: adminPassword })
                      });
                      
                      if (res.ok) {
                        const { token } = await res.json();
                        setAdminToken(token);
                        
                        const clientsRes = await fetch('/api/clients', {
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        if (clientsRes.ok) {
                          const clientsData = await clientsRes.json();
                          setClients(clientsData);
                        }
                        
                        setView('admin');
                        setAdminPassword('');
                        setLoginError('');
                      } else {
                        setLoginError('Senha incorreta. Tente novamente.');
                      }
                    } catch (error) {
                      setLoginError('Erro ao conectar com o servidor.');
                    }
                  }
                }}
                className={`w-full px-4 py-2 border ${loginError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-yellow-500'} rounded-lg focus:ring-2 outline-none transition-all`}
                required
              />
              {loginError && <p className="text-red-500 text-xs mt-1">{loginError}</p>}
            </div>
            
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => { setView('welcome'); setAdminPassword(''); setLoginError(''); }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Entrar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'admin') {
    const cronogramaParcelas = clients.flatMap(c => 
      (c.simulacoes || (c.simulacao ? [c.simulacao] : []))
        .filter((s: any) => s.status !== 'pendente' && s.status !== 'reprovado' && s.status !== 'renegociado' && !s.arquivado)
        .flatMap((s: any, sIdx: number) => 
        (s.parcelas || []).map((p: any, pIdx: number) => {
          const abatimentosTotal = p.abatimentos ? p.abatimentos.reduce((acc: number, a: any) => acc + a.valor, 0) : 0;
          return {
            ...p,
            valorRestante: Math.max(0, parseFloat(p.valor || 0) - abatimentosTotal),
            clientId: c.id,
            clientName: c.nomeCompleto,
            clientPhone: c.telefone,
            simIndex: sIdx,
            parcelaIndex: pIdx,
            taxaAtrasoDia: s.taxaAtrasoDia
          };
        })
      )
    ).filter(p => !p.paga)
     .sort((a, b) => {
       const dateCompare = a.dataVencimento.localeCompare(b.dataVencimento);
       if (dateCompare !== 0) return dateCompare;
       return a.clientName.localeCompare(b.clientName);
     });

    const filteredCronogramaParcelas = cronogramaParcelas.filter((p: any) => {
      const date = p.dataVencimento;
      if (!date) return false;
      const [year, month] = date.split('-');
      
      if (cronogramaYear !== 'all' && year !== cronogramaYear) return false;
      if (cronogramaMonth !== 'all' && month !== cronogramaMonth) return false;

      if (cronogramaStatusFilter !== 'all') {
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const vencimento = parseLocalDate(date);
        vencimento.setHours(0,0,0,0);
        
        if (cronogramaStatusFilter === 'vencidas' && vencimento >= hoje) return false;
        if (cronogramaStatusFilter === 'hoje' && vencimento.getTime() !== hoje.getTime()) return false;
        if (cronogramaStatusFilter === 'a_vencer' && vencimento <= hoje) return false;
      }

      return true;
    });

    const groupedCronograma = filteredCronogramaParcelas.reduce((acc: any, p: any) => {
      if (!acc[p.dataVencimento]) {
        acc[p.dataVencimento] = [];
      }
      acc[p.dataVencimento].push(p);
      return acc;
    }, {} as Record<string, any[]>);

    const adminTransactions = clients.find(c => c.id === 'admin-transactions')?.dados?.retiradas || [];

    const unifiedTransactions = [
      ...clients.flatMap(c => 
        (c.simulacoes || (c.simulacao ? [c.simulacao] : []))
          .filter((s: any) => s.status !== 'pendente' && s.status !== 'reprovado')
          .flatMap((s: any, sIdx: number) => 
            (s.parcelas || []).filter((p: any) => p.paga).map((p: any) => ({
              id: `p-${c.id}-${sIdx}-${p.numero}`,
              data: p.dataPagamento || p.dataVencimento,
              tipo: 'entrada',
              descricao: `Pagamento: ${c.nomeCompleto}`,
              detalhes: `Parcela ${p.numero} - CPF: ${c.cpf}`,
              valor: parseFloat(p.valor || 0),
              clienteId: c.id
            }))
          )
      ),
      ...clients.flatMap(c => 
        (c.simulacoes || (c.simulacao ? [c.simulacao] : []))
          .filter((s: any) => s.status !== 'pendente' && s.status !== 'reprovado')
          .flatMap((s: any, sIdx: number) => 
            (s.parcelas || []).flatMap((p: any) => 
              (p.abatimentos || []).map((a: any, aIdx: number) => ({
                id: `a-${c.id}-${sIdx}-${p.numero}-${aIdx}`,
                data: a.data,
                tipo: 'entrada',
                descricao: `Abatimento: ${c.nomeCompleto}`,
                detalhes: `Parcela ${p.numero} - CPF: ${c.cpf}`,
                valor: parseFloat(a.valor || 0),
                clienteId: c.id
              }))
            )
          )
      ),
      ...clients.flatMap(c => 
        (c.simulacoes || (c.simulacao ? [c.simulacao] : []))
          .filter((s: any) => s.status !== 'pendente' && s.status !== 'reprovado' && s.status !== 'renegociado' && !s.arquivado)
          .flatMap((s: any, sIdx: number) => 
            (s.parcelas || []).filter((p: any) => !p.paga).map((p: any) => {
              const abatimentosTotal = p.abatimentos ? p.abatimentos.reduce((acc: number, a: any) => acc + a.valor, 0) : 0;
              return {
                id: `prev-${c.id}-${sIdx}-${p.numero}`,
                data: p.dataVencimento,
                tipo: 'entrada_prevista',
                descricao: `Previsão: ${c.nomeCompleto}`,
                detalhes: `Parcela ${p.numero} (Pendente) - CPF: ${c.cpf}`,
                valor: Math.max(0, parseFloat(p.valor || 0) - abatimentosTotal),
                clienteId: c.id
              };
            })
          )
      ),
      ...clients.flatMap(c => 
        (c.simulacoes || (c.simulacao ? [c.simulacao] : []))
          .filter((s: any) => s.status !== 'pendente' && s.status !== 'reprovado' && !s.isRenegociacao)
          .map((s: any, sIdx: number) => ({
            id: `s-${c.id}-${sIdx}`,
            data: s.dataCriacao || c.dataCadastro || getLocalISODate(),
            tipo: 'saida',
            descricao: `Empréstimo: ${c.nomeCompleto}`,
            detalhes: `Liberação de Crédito - CPF: ${c.cpf}`,
            valor: parseFloat(s.valorSolicitado || 0),
            clienteId: c.id
          }))
      ),
      ...adminTransactions.map((t: any) => ({
        ...t,
        detalhes: t.descricao,
        valor: parseFloat(t.valor || 0)
      }))
    ];

    // Sort all transactions by date to calculate running balance
    const sortedAllTransactions = [...unifiedTransactions].sort((a: any, b: any) => {
      const dateA = new Date(a.data).getTime();
      const dateB = new Date(b.data).getTime();
      if (dateA !== dateB) return dateA - dateB;
      
      const descA = a.descricao || '';
      const descB = b.descricao || '';
      return descA.localeCompare(descB);
    });
    let runningBalance = 0;
    const transactionsWithBalance = sortedAllTransactions.map(t => {
      if (['entrada', 'aporte'].includes(t.tipo)) {
        runningBalance += t.valor;
      } else if (['saida', 'retirada'].includes(t.tipo)) {
        runningBalance -= t.valor;
      }
      return { ...t, saldoApos: runningBalance };
    });

    const fluxoFilter = fluxoMonth === 'all' ? fluxoYear : `${fluxoYear}-${fluxoMonth}`;

    const monthEntradas = clients.flatMap(c => 
      (c.simulacoes || (c.simulacao ? [c.simulacao] : []))
        .filter((s: any) => s.status !== 'pendente' && s.status !== 'reprovado')
        .flatMap((s: any) => [
          ...(s.parcelas || []).filter((p: any) => p.paga && (p.dataPagamento || p.dataVencimento)?.startsWith(fluxoFilter)).map((p: any) => parseFloat(p.valor || 0)),
          ...(s.parcelas || []).flatMap((p: any) => (p.abatimentos || []).filter((a: any) => a.data?.startsWith(fluxoFilter)).map((a: any) => parseFloat(a.valor || 0)))
        ]
      )
    ).reduce((acc, val) => acc + val, 0);

    const monthPendentes = clients.flatMap(c => 
      (c.simulacoes || (c.simulacao ? [c.simulacao] : []))
        .filter((s: any) => s.status !== 'pendente' && s.status !== 'reprovado' && s.status !== 'renegociado' && !s.arquivado)
        .flatMap((s: any) => 
        (s.parcelas || []).filter((p: any) => {
          const hoje = new Date();
          hoje.setHours(0,0,0,0);
          const vencimento = parseLocalDate(p.dataVencimento);
          vencimento.setHours(0,0,0,0);
          return !p.paga && vencimento >= hoje && p.dataVencimento.startsWith(fluxoFilter);
        }).map((p: any) => {
          const abatimentosTotal = p.abatimentos ? p.abatimentos.reduce((acc: number, a: any) => acc + a.valor, 0) : 0;
          return Math.max(0, parseFloat(p.valor || 0) - abatimentosTotal);
        })
      )
    ).reduce((acc, val) => acc + val, 0);

    const monthInadimplencia = clients.flatMap(c => 
      (c.simulacoes || (c.simulacao ? [c.simulacao] : []))
        .filter((s: any) => s.status !== 'pendente' && s.status !== 'reprovado' && s.status !== 'renegociado' && !s.arquivado)
        .flatMap((s: any) => 
        (s.parcelas || []).filter((p: any) => {
          const hoje = new Date();
          hoje.setHours(0,0,0,0);
          const vencimento = parseLocalDate(p.dataVencimento);
          vencimento.setHours(0,0,0,0);
          return !p.paga && vencimento < hoje && p.dataVencimento.startsWith(fluxoFilter);
        }).map((p: any) => {
          const abatimentosTotal = p.abatimentos ? p.abatimentos.reduce((acc: number, a: any) => acc + a.valor, 0) : 0;
          return Math.max(0, parseFloat(p.valor || 0) - abatimentosTotal);
        })
      )
    ).reduce((acc, val) => acc + val, 0);

    const monthSaidas = clients.flatMap(c => 
      (c.simulacoes || (c.simulacao ? [c.simulacao] : [])).filter((s: any) => {
        // If sim has dataCriacao, use it. Otherwise use client's dataCadastro
        const date = s.dataCriacao || c.dataCadastro;
        return date && date.startsWith(fluxoFilter) && s.status !== 'pendente' && s.status !== 'reprovado' && !s.isRenegociacao;
      })
    ).reduce((acc, s) => acc + parseFloat(s.valorSolicitado || 0), 0);

    const monthRetiradas = adminTransactions
      .filter((t: any) => t.data.startsWith(fluxoFilter) && t.tipo !== 'aporte')
      .reduce((acc: number, t: any) => acc + parseFloat(t.valor || 0), 0);

    const monthAportes = adminTransactions
      .filter((t: any) => t.data.startsWith(fluxoFilter) && t.tipo === 'aporte')
      .reduce((acc: number, t: any) => acc + parseFloat(t.valor || 0), 0);

    const saldo = monthEntradas + monthAportes - monthSaidas - monthRetiradas;

    const fundoDeCaixa = unifiedTransactions.reduce((acc: number, t: any) => {
      const tPeriod = t.data ? t.data.substring(0, fluxoFilter.length) : '';
      if (tPeriod && tPeriod <= fluxoFilter) {
        if (['entrada', 'aporte'].includes(t.tipo)) {
          return acc + t.valor;
        } else if (['saida', 'retirada'].includes(t.tipo)) {
          return acc - t.valor;
        }
      }
      return acc;
    }, 0);

    const handleAddRetirada = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newRetirada.valor || !newRetirada.descricao) return;

      const adminClient = clients.find(c => c.id === 'admin-transactions');
      const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const transaction = { 
        id: generateUUID(), 
        valor: parseFloat(newRetirada.valor), 
        descricao: newRetirada.descricao, 
        data: newRetirada.data,
        tipo: newRetirada.tipo
      };
      
      try {
        if (adminClient) {
          const updatedClient = {
            ...adminClient,
            dados: {
              ...adminClient.dados,
              retiradas: [...(adminClient.dados?.retiradas || []), transaction]
            }
          };
          await fetch(`/api/clients/${adminClient.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify(updatedClient)
          });
          setClients(clients.map(c => c.id === adminClient.id ? updatedClient : c));
        } else {
          const newAdminClient = {
            id: 'admin-transactions',
            nomeCompleto: 'Admin Transactions',
            cpf: '00000000000',
            dataCadastro: getLocalISODateTime(),
            dados: { retiradas: [transaction] }
          };
          await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAdminClient)
          });
          setClients([...clients, newAdminClient]);
        }
        setNewRetirada({ valor: '', descricao: '', data: getLocalISODate(), tipo: 'retirada' });
        alert('Movimentação adicionada com sucesso!');
      } catch (error) {
        alert('Erro ao adicionar movimentação.');
      }
    };

    const handleEditFluxoItem = (item: any) => {
      setEditingTransaction(item);
      setEditTransactionData({
        valor: item.valor.toString(),
        descricao: item.descricao,
        data: item.data.split('T')[0],
        tipo: item.tipo
      });
    };

    const handleSaveFluxoEdit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingTransaction) return;

      const { id, tipo } = editingTransaction;
      const newVal = parseFloat(editTransactionData.valor);
      const newDate = editTransactionData.data;
      const newDesc = editTransactionData.descricao;
      const newTipo = editTransactionData.tipo;

      try {
        if (tipo === 'aporte' || tipo === 'retirada') {
          const adminClient = clients.find(c => c.id === 'admin-transactions');
          if (!adminClient) return;
          const updatedRetiradas = adminClient.dados.retiradas.map((t: any) => 
            t.id === id ? { ...t, valor: newVal, descricao: newDesc, data: newDate, tipo: newTipo } : t
          );
          const updatedClient = { ...adminClient, dados: { ...adminClient.dados, retiradas: updatedRetiradas } };
          await saveClientUpdate(updatedClient);
        } else if (tipo === 'entrada') {
          const parts = id.split('-');
          const cId = parts[1];
          const sIdx = parseInt(parts[2]);
          const pNum = parseInt(parts[3]);
          
          const client = clients.find(c => c.id === cId);
          if (!client) return;
          
          const updatedSimulacoes = [...client.simulacoes];
          const updatedParcelas = [...updatedSimulacoes[sIdx].parcelas];
          const pIdx = updatedParcelas.findIndex(p => p.numero === pNum);
          
          if (pIdx !== -1) {
            updatedParcelas[pIdx] = { 
              ...updatedParcelas[pIdx], 
              valor: newVal,
              dataPagamento: newDate.includes('T') ? newDate : `${newDate}T00:00:00`
            };
            updatedSimulacoes[sIdx] = { ...updatedSimulacoes[sIdx], parcelas: updatedParcelas };
            const updatedClient = { ...client, simulacoes: updatedSimulacoes };
            await saveClientUpdate(updatedClient);
          }
        } else if (tipo === 'saida') {
          const parts = id.split('-');
          const cId = parts[1];
          const sIdx = parseInt(parts[2]);
          
          const client = clients.find(c => c.id === cId);
          if (!client) return;
          
          const updatedSimulacoes = [...client.simulacoes];
          updatedSimulacoes[sIdx] = { 
            ...updatedSimulacoes[sIdx], 
            valorSolicitado: newVal.toString(),
            dataCriacao: newDate.includes('T') ? newDate : `${newDate}T00:00:00`
          };
          const updatedClient = { ...client, simulacoes: updatedSimulacoes };
          await saveClientUpdate(updatedClient);
        }
        
        setEditingTransaction(null);
        alert('Lançamento corrigido com sucesso!');
      } catch (error) {
        alert('Erro ao salvar correção.');
      }
    };

    const handleDeleteFluxoItem = async (item: any) => {
      if (!window.confirm('Tem certeza que deseja excluir este lançamento do fluxo de caixa?')) return;

      const { id, tipo } = item;

      try {
        if (tipo === 'aporte' || tipo === 'retirada') {
          const adminClient = clients.find(c => c.id === 'admin-transactions');
          if (!adminClient) return;
          const updatedRetiradas = adminClient.dados.retiradas.filter((t: any) => t.id !== id);
          const updatedClient = { ...adminClient, dados: { ...adminClient.dados, retiradas: updatedRetiradas } };
          await saveClientUpdate(updatedClient);
        } else if (tipo === 'entrada') {
          const parts = id.split('-');
          const cId = parts[1];
          const sIdx = parseInt(parts[2]);
          const pNum = parseInt(parts[3]);
          
          const client = clients.find(c => c.id === cId);
          if (!client) return;
          
          const updatedSimulacoes = [...client.simulacoes];
          const updatedParcelas = [...updatedSimulacoes[sIdx].parcelas];
          const pIdx = updatedParcelas.findIndex(p => p.numero === pNum);
          
          if (pIdx !== -1) {
            // To "delete" an entry from flux, we mark it as not paid
            updatedParcelas[pIdx] = { 
              ...updatedParcelas[pIdx], 
              paga: false,
              status: 'pendente',
              dataPagamento: null
            };
            updatedSimulacoes[sIdx] = { ...updatedSimulacoes[sIdx], parcelas: updatedParcelas };
            const updatedClient = { ...client, simulacoes: updatedSimulacoes };
            await saveClientUpdate(updatedClient);
          }
        } else if (tipo === 'saida') {
          const parts = id.split('-');
          const cId = parts[1];
          const sIdx = parseInt(parts[2]);
          
          const client = clients.find(c => c.id === cId);
          if (!client) return;
          
          const updatedSimulacoes = [...client.simulacoes];
          // To "delete" a loan release, we might need to delete the whole simulation or mark it as rejected
          if (window.confirm('Excluir este lançamento de saída irá remover o empréstimo inteiro deste cliente. Continuar?')) {
            updatedSimulacoes.splice(sIdx, 1);
            const updatedClient = { ...client, simulacoes: updatedSimulacoes };
            await saveClientUpdate(updatedClient);
          } else {
            return;
          }
        }
        alert('Lançamento excluído com sucesso!');
      } catch (error) {
        alert('Erro ao excluir lançamento.');
      }
    };

    const saveClientUpdate = async (updatedClient: any) => {
      const response = await fetch(`/api/clients/${updatedClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify(updatedClient)
      });
      if (!response.ok) throw new Error('Failed to update');
      setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
      if (selectedClient && selectedClient.id === updatedClient.id) {
        setSelectedClient(updatedClient);
      }
    };

    const startEditingSimulacao = (simIndex: number, sim: any) => {
    setEditingSimIndex(simIndex);
    setEditSimData({
      valorSolicitado: sim.valorSolicitado || '',
      prazo: sim.prazo || 'mensal',
      quantidade: sim.quantidade || '1',
      taxaJuros: sim.taxaJuros || adminSettings.taxaJuros,
      taxaAtrasoDia: sim.taxaAtrasoDia || adminSettings.taxaAtrasoDia,
      tipoTaxa: sim.tipoTaxa || adminSettings.tipoTaxa || 'diaria',
      dataInicial: sim.dataCriacao ? sim.dataCriacao.split('T')[0] : getLocalISODate(),
      dataVencimentoUnica: sim.prazo === 'única' && sim.parcelas && sim.parcelas.length > 0 ? sim.parcelas[0].dataVencimento.split('T')[0] : ''
    });
  };

  const cancelEditingSimulacao = () => {
    setEditingSimIndex(null);
  };

  const saveEditingSimulacao = async (simIndex: number) => {
    if (!selectedClient) return;

    const valor = parseFloat(editSimData.valorSolicitado);
    if (!valor || isNaN(valor)) {
      alert('Valor solicitado inválido.');
      return;
    }

    const qtd = editSimData.prazo === 'única' ? 1 : parseInt(editSimData.quantidade) || 1;
    const taxa = parseFloat(editSimData.taxaJuros) || parseFloat(adminSettings.taxaJuros) || 1;
    const isMensal = true; // Fixado mensalmente
    
    let diasTotais = 30;
    let dataAtual = editSimData.dataInicial ? parseLocalDate(editSimData.dataInicial) : new Date();
    dataAtual.setHours(0, 0, 0, 0);

    if (editSimData.prazo === 'dia') diasTotais = qtd;
    else if (editSimData.prazo === 'semanal') diasTotais = qtd * 7;
    else if (editSimData.prazo === 'quinzenal') diasTotais = qtd * 15;
    else if (editSimData.prazo === 'mensal') diasTotais = qtd * 30;
    else if (editSimData.prazo === 'única') {
      if (!editSimData.dataVencimentoUnica) {
        alert('Por favor, informe a data de pagamento para a parcela única.');
        return;
      }
      const dataVenc = parseLocalDate(editSimData.dataVencimentoUnica);
      dataVenc.setHours(0, 0, 0, 0);
      const diffTime = dataVenc.getTime() - dataAtual.getTime();
      diasTotais = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const fatorTempo = isMensal ? (diasTotais / 30) : diasTotais;
    const valorTotal = valor + (valor * (taxa / 100) * fatorTempo);
    const valorParcela = valorTotal / qtd;

    const updatedSimulacoes = [...selectedClient.simulacoes];
    const novasParcelas = [];
    const existingParcelas = updatedSimulacoes[simIndex].parcelas || [];
    const oldDataInicial = updatedSimulacoes[simIndex].dataCriacao ? updatedSimulacoes[simIndex].dataCriacao.split('T')[0] : '';
    const dateOrPrazoChanged = editSimData.dataInicial !== oldDataInicial || editSimData.prazo !== updatedSimulacoes[simIndex].prazo;

    for (let i = 1; i <= qtd; i++) {
      let dataVencimento = new Date(dataAtual);
      if (editSimData.prazo === 'dia') {
        dataVencimento.setDate(dataVencimento.getDate() + i);
      } else if (editSimData.prazo === 'semanal') {
        dataVencimento.setDate(dataVencimento.getDate() + (i * 7));
      } else if (editSimData.prazo === 'quinzenal') {
        dataVencimento.setDate(dataVencimento.getDate() + (i * 15));
      } else if (editSimData.prazo === 'mensal') {
        dataVencimento.setMonth(dataVencimento.getMonth() + i);
      } else if (editSimData.prazo === 'única') {
        dataVencimento = parseLocalDate(editSimData.dataVencimentoUnica);
      }

      const existingParcela = existingParcelas.find((p: any) => p.numero === i);
      
      let finalDataVencimento = getLocalISODate(dataVencimento);
      if (existingParcela && !dateOrPrazoChanged) {
        finalDataVencimento = existingParcela.dataVencimento;
      }

      novasParcelas.push({
        numero: i,
        dataVencimento: finalDataVencimento,
        valor: existingParcela && existingParcela.valor !== valorParcela && editSimData.valorSolicitado === updatedSimulacoes[simIndex].valorSolicitado && editSimData.taxaJuros === updatedSimulacoes[simIndex].taxaJuros && editSimData.quantidade === updatedSimulacoes[simIndex].quantidade ? existingParcela.valor : valorParcela,
        status: existingParcela ? existingParcela.status : 'pendente',
        paga: existingParcela ? existingParcela.paga : false,
        dataPagamento: existingParcela ? existingParcela.dataPagamento : undefined,
        abatimentos: existingParcela ? existingParcela.abatimentos : undefined,
        jurosCongelados: existingParcela ? existingParcela.jurosCongelados : undefined,
        dataCongelamento: existingParcela ? existingParcela.dataCongelamento : undefined
      });
    }

    updatedSimulacoes[simIndex] = {
      ...updatedSimulacoes[simIndex],
      ...editSimData,
      dataCriacao: editSimData.dataInicial ? `${editSimData.dataInicial}T00:00:00` : updatedSimulacoes[simIndex].dataCriacao,
      parcelas: novasParcelas
    };

    const updatedClient = {
      ...selectedClient,
      simulacoes: updatedSimulacoes
    };

    try {
      const response = await fetch(`/api/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(updatedClient)
      });
      
      if (!response.ok) {
        throw new Error('Falha ao salvar edição no servidor');
      }
      
      setSelectedClient(updatedClient);
      setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
      setEditingSimIndex(null);
    } catch (error) {
      console.error("Erro ao salvar simulação:", error);
      alert('Erro ao salvar empréstimo.');
    }
  };

  const handleExcluirSimulacao = async (simIndex: number) => {
    if (!selectedClient) return;
    
    if (!window.confirm('Tem certeza que deseja excluir este empréstimo? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    const updatedSimulacoes = [...selectedClient.simulacoes];
    updatedSimulacoes.splice(simIndex, 1);
    
    const updatedClient = {
      ...selectedClient,
      simulacoes: updatedSimulacoes,
      simulacao: null
    };
    
    try {
      const success = await updateClientWithUndo(updatedClient, 'Excluir Empréstimo');
      
      if (!success) {
        throw new Error('Falha ao excluir empréstimo no servidor');
      }
      
      setClients(clients.map(c => c.id === selectedClient.id ? updatedClient : c));
      setSelectedClient(updatedClient);
    } catch (error) {
      console.error('Error deleting simulacao:', error);
      alert('Erro ao excluir empréstimo. Tente novamente.');
    }
  };

  const handleAprovarSimulacao = async (simIndex: number, aprovar: boolean) => {
      if (!selectedClient) return;
      
      const simulacao = selectedClient.simulacoes[simIndex];
      
      if (aprovar && (!simulacao.parcelas || simulacao.parcelas.length === 0)) {
        alert('Por favor, edite a simulação para definir a taxa de juros e gerar as parcelas antes de aprovar.');
        return;
      }

      const updatedSimulacoes = [...selectedClient.simulacoes];
      updatedSimulacoes[simIndex] = {
        ...updatedSimulacoes[simIndex],
        status: aprovar ? 'aprovado' : 'reprovado'
      };
      
      const updatedClient = {
        ...selectedClient,
        simulacoes: updatedSimulacoes
      };
      
      try {
        const success = await updateClientWithUndo(updatedClient, aprovar ? 'Aprovar Empréstimo' : 'Reprovar Empréstimo');
        
        if (!success) {
          throw new Error('Falha ao atualizar status no servidor');
        }
        
        setClients(clients.map(c => c.id === selectedClient.id ? updatedClient : c));
        setSelectedClient(updatedClient);
      } catch (error) {
        console.error("Erro ao atualizar status da simulação:", error);
        alert("Erro ao atualizar status.");
      }
    };

    const handleGeneratePDF = async (simIndex: number) => {
      const element = document.getElementById(`simulacao-detalhes-${simIndex}`);
      if (!element) return;
      
      const opt = {
        margin:       10,
        filename:     `emprestimo-${selectedClient?.nomeCompleto.replace(/\s+/g, '-')}-simulacao-${simIndex + 1}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const }
      };
      
      // Hide buttons during PDF generation
      const buttons = element.querySelectorAll('.print\\:hidden');
      buttons.forEach((btn: any) => btn.style.display = 'none');
      
      try {
        // @ts-ignore
        const html2pdfModule = await import('html2pdf.js');
        const h2p = (html2pdfModule as any).default || html2pdfModule;
        await (h2p as any)().set(opt).from(element).save();
      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Erro ao gerar PDF. Tente usar o botão Imprimir.");
      } finally {
        // Restore buttons
        buttons.forEach((btn: any) => btn.style.display = '');
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans relative">
        <div className="absolute top-4 left-4 flex gap-3 print:hidden">
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-2 bg-white text-slate-800 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
            title="Alternar Tela Cheia"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            {isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
          </button>
        </div>
        <div className="max-w-[98%] mx-auto">
          <div className="flex justify-between items-center mb-8 print:hidden">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Painel do Administrador</h1>
              <p className="text-slate-500">Gerenciamento de clientes cadastrados</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { setView('simulation'); setSelectedClient(null); }}
                className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                <ArrowLeft size={18} />
                Página Principal
              </button>
              <button 
                onClick={() => { 
                  setView('form'); 
                  setSelectedClient(null); 
                  setFormData(initialFormData);
                  setCategorizedFiles({});
                }}
                className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm font-medium"
              >
                <UserPlus size={18} />
                Cadastrar Novo Cliente
              </button>
              <button 
                onClick={() => {
                  setAdminToken('');
                  setView('welcome');
                }}
                className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors shadow-sm font-medium"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          </div>

          {(() => {
            const pendingClients = clients.filter(c => (c.simulacoes || (c.simulacao ? [c.simulacao] : [])).some((s: any) => s.status === 'pendente'));
            if (pendingClients.length > 0) {
              return (
                <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
                  <AlertCircle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
                  <div className="w-full">
                    <h3 className="text-yellow-800 font-bold">Atenção: Empréstimos Pendentes</h3>
                    <p className="text-yellow-700 mt-1 mb-2">
                      Existem <strong>{pendingClients.length}</strong> solicitação(ões) de empréstimo aguardando aprovação:
                    </p>
                    <div className="flex flex-col gap-2">
                      {pendingClients.map(client => (
                        <button
                          key={client.id}
                          onClick={() => {
                            setAdminTab('clientes');
                            setSelectedClient(client);
                          }}
                          className="text-left bg-white/60 hover:bg-white px-3 py-2 rounded-md border border-yellow-200 text-yellow-800 transition-colors flex justify-between items-center"
                        >
                          <span className="font-semibold">{client.nomeCompleto}</span>
                          <span className="text-sm underline">Analisar solicitação &rarr;</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <div className="flex gap-4 mb-8 border-b border-slate-200 print:hidden">
            <button
              onClick={() => { setAdminTab('clientes'); setSelectedClient(null); setSearchTerm(''); }}
              className={`pb-3 px-4 text-sm font-medium transition-colors ${adminTab === 'clientes' ? 'border-b-2 border-yellow-500 text-yellow-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Clientes
            </button>
            <button
              onClick={() => { setAdminTab('cronograma'); setSelectedClient(null); setSearchTerm(''); }}
              className={`pb-3 px-4 text-sm font-medium transition-colors ${adminTab === 'cronograma' ? 'border-b-2 border-yellow-500 text-yellow-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Cronograma de Clientes
            </button>
            <button
              onClick={() => { setAdminTab('fluxo_caixa'); setSelectedClient(null); setSearchTerm(''); }}
              className={`pb-3 px-4 text-sm font-medium transition-colors ${adminTab === 'fluxo_caixa' ? 'border-b-2 border-yellow-500 text-yellow-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Fluxo de Caixa
            </button>
            <button
              onClick={() => { setAdminTab('mensagens'); setSelectedClient(null); setSearchTerm(''); }}
              className={`pb-3 px-4 text-sm font-medium transition-colors relative ${adminTab === 'mensagens' ? 'border-b-2 border-yellow-500 text-yellow-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Mensagens
              {unreadChatCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadChatCount}
                </span>
              )}
            </button>
          </div>

          {!selectedClient && adminTab === 'clientes' && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <LayoutDashboard size={20} className="text-yellow-500" />
                  Configurações Globais de Taxas
                </h2>
                <button
                  onClick={() => {
                    const link = `https://ais-pre-iuaewkhwf2i2wi4bd7n74o-6135474589.us-east1.run.app/?cliente=true`;
                    navigator.clipboard.writeText(link);
                    alert('Link da Área do Cliente copiado para a área de transferência!\n\nEnvie este link para os seus clientes.');
                  }}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  <User size={16} />
                  Copiar Link do Cliente
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Taxa de Juros ao Mês (%)
                  </label>
                  <input 
                    type="number" 
                    value={adminSettings.taxaJuros} 
                    onChange={(e) => setAdminSettings({...adminSettings, taxaJuros: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Juros por Atraso ao Dia (%)</label>
                  <input 
                    type="number" 
                    value={adminSettings.taxaAtrasoDia} 
                    onChange={(e) => setAdminSettings({...adminSettings, taxaAtrasoDia: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                  />
                </div>
                <div className="pb-2 text-sm text-slate-500">
                  <button 
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/settings', {
                          method: 'PUT',
                          headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${adminToken}`
                          },
                          body: JSON.stringify(adminSettings)
                        });
                        if (res.ok) alert('Configurações salvas com sucesso!');
                      } catch (error) {
                        alert('Erro ao salvar configurações');
                      }
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Salvar Taxas
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedClient && adminTab !== 'mensagens' ? (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden" id="pdf-content">
              <div className="bg-slate-800 px-8 py-6 text-white flex justify-between items-center print:bg-slate-800 print:text-white">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold">{selectedClient.nomeCompleto}</h2>
                    {(() => {
                      const status = getClientStatus(selectedClient);
                      const statusDisplay = getStatusDisplay(status);
                      return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color} ${statusDisplay.text}`}>
                          {statusDisplay.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-slate-300">CPF: {selectedClient.cpf} | Cadastrado em: {selectedClient.dataCadastro}</p>
                </div>
                <div className="flex gap-3 print:hidden">
                  <button 
                    onClick={() => {
                      setAdminTab('mensagens');
                      fetchMessages(selectedClient.id);
                      markChatAsRead(selectedClient.id, 'admin');
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <MessageSquare size={18} />
                    Mensagem
                  </button>
                  <button 
                    onClick={() => {
                      setSimulacao({
                        valorSolicitado: '',
                        prazo: 'mensal',
                        quantidade: '1',
                        parcelas: [],
                        taxaJuros: adminSettings.taxaJuros,
                        taxaAtrasoDia: adminSettings.taxaAtrasoDia,
                        tipoTaxa: adminSettings.tipoTaxa || 'diaria',
                        dataVencimentoUnica: '',
                        isRenegociacao: false,
                        renegociadoFromSimIndices: []
                      });
                      setView('simulation');
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Calculator size={18} />
                    Nova Simulação
                  </button>
                  <button 
                    onClick={() => {
                      setFormData(selectedClient);
                      setCategorizedFiles({});
                      setIsEditingClientData(true);
                      setView('form');
                    }}
                    className="bg-blue-500/20 hover:bg-blue-500 text-blue-200 hover:text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Edit2 size={18} />
                    Editar Dados
                  </button>
                  <button 
                    onClick={() => setClientToDelete(selectedClient)}
                    className="bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={18} />
                    Excluir
                  </button>
                  <button 
                    onClick={() => setSelectedClient(null)}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Fechar Detalhes
                  </button>
                </div>
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={printingSimIndex !== null ? 'print:hidden' : ''}>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Dados Pessoais</h3>
                  <div className="space-y-3 text-sm">
                    <p><span className="font-medium text-slate-500">Nome da Mãe:</span> {selectedClient.nomeMae}</p>
                    <p><span className="font-medium text-slate-500">RG:</span> {selectedClient.rg}</p>
                    <p><span className="font-medium text-slate-500">Data de Nascimento:</span> {formatDate(selectedClient.dataNascimento)}</p>
                    <p><span className="font-medium text-slate-500">Telefone:</span> {selectedClient.telefone}</p>
                    <p><span className="font-medium text-slate-500">Endereço:</span> {selectedClient.endereco}, {selectedClient.numero} {selectedClient.complemento && `- ${selectedClient.complemento}`}</p>
                    <p><span className="font-medium text-slate-500">Bairro/Cidade:</span> {selectedClient.bairro}, {selectedClient.cidade} - {selectedClient.estado}</p>
                    <p><span className="font-medium text-slate-500">CEP:</span> {selectedClient.cep}</p>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-800 mb-4 mt-8 border-b pb-2">Parente Próximo</h3>
                  <div className="space-y-3 text-sm">
                    <p><span className="font-medium text-slate-500">Nome:</span> {selectedClient.parenteNome}</p>
                    <p><span className="font-medium text-slate-500">Grau de Parentesco:</span> {selectedClient.parenteGrau || 'Não informado'}</p>
                    <p><span className="font-medium text-slate-500">Telefone:</span> {selectedClient.parenteTelefone}</p>
                    <p><span className="font-medium text-slate-500">Endereço:</span> {selectedClient.parenteEndereco}, {selectedClient.parenteNumero}</p>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 mt-8 border-b pb-2">Outras Informações</h3>
                  <div className="space-y-3 text-sm">
                    <p><span className="font-medium text-slate-500">Atividade Financeira:</span> {selectedClient.atividadeFinanceira || 'Não informado'}</p>
                    {selectedClient.atividadeFinanceiraEndereco && (
                      <p><span className="font-medium text-slate-500">Endereço da Atividade:</span> {selectedClient.atividadeFinanceiraEndereco}, {selectedClient.atividadeFinanceiraNumero} {selectedClient.atividadeFinanceiraComplemento && `- ${selectedClient.atividadeFinanceiraComplemento}`} - {selectedClient.atividadeFinanceiraBairro}, {selectedClient.atividadeFinanceiraCidade} - {selectedClient.atividadeFinanceiraEstado} (CEP: {selectedClient.atividadeFinanceiraCep})</p>
                    )}
                    <p><span className="font-medium text-slate-500">Indicação:</span> {selectedClient.quemIndicou || 'Não informado'}</p>
                    <p><span className="font-medium text-slate-500">Redes Sociais:</span> {selectedClient.redesSociais || 'Não informado'}</p>
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="font-medium text-slate-500 mb-1">Observações Gerais:</p>
                      <p className="text-slate-700 whitespace-pre-wrap">{selectedClient.observacoes || 'Nenhuma observação registrada.'}</p>
                    </div>
                    {adminToken && (
                      <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200 print:hidden">
                        <p className="font-bold text-yellow-800 mb-1 flex items-center gap-2">
                          <FileText size={16} />
                          Anotações Internas (Visão Admin):
                        </p>
                        <p className="text-yellow-900 whitespace-pre-wrap">{selectedClient.observacoesAdmin || 'Nenhuma anotação interna registrada.'}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className={printingSimIndex !== null ? 'print:hidden' : ''}>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2 print:hidden">Documentos Anexados</h3>
                  {selectedClient.arquivos && selectedClient.arquivos.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 print:hidden">
                      {selectedClient.arquivos.map((file: any, index: number) => (
                        <div key={index} className="border border-slate-200 rounded-xl p-4 flex flex-col items-center">
                          {file.type.startsWith('image/') ? (
                            <img src={file.url} alt={file.name} className="max-w-full h-auto max-h-64 object-contain rounded-lg mb-3" />
                          ) : (
                            <div className="w-full h-32 bg-slate-100 flex items-center justify-center rounded-lg mb-3">
                              <FileText size={48} className="text-slate-400" />
                            </div>
                          )}
                          {file.categoria && (
                            <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full mb-2">
                              {file.categoria}
                            </span>
                          )}
                          <p className="text-sm font-medium text-slate-700 truncate w-full text-center" title={file.name}>{file.name}</p>
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                          >
                            <Eye size={16} /> Ver Arquivo Original
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                      Nenhum documento anexado por este cliente.
                    </div>
                  )}
                </div>

                {/* Detalhes do Empréstimo */}
                {selectedClient.simulacoes && selectedClient.simulacoes.length > 0 ? (
                  <div className="md:col-span-2 mt-4 space-y-8">
                    <div className={`flex justify-between items-center mb-2 ${printingSimIndex !== null ? 'print:hidden' : ''}`}>
                      <h3 className="text-lg font-bold text-slate-800">Histórico de Empréstimos</h3>
                      {selectedClient.simulacoes.some((s: any) => s.arquivado) && (
                        <button
                          onClick={() => setShowArchivedLoans(!showArchivedLoans)}
                          className="text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {showArchivedLoans ? 'Ocultar Arquivados' : 'Ver Arquivados'}
                        </button>
                      )}
                    </div>
                    {selectedClient.simulacoes.map((sim: any, simIndex: number) => {
                      if (sim.arquivado && !showArchivedLoans) return null;
                      
                      const isPrintingThis = printingSimIndex === simIndex;
                      const hideOnPrintClass = printingSimIndex !== null && !isPrintingThis ? 'print:hidden' : '';

                      return (
                      <div key={simIndex} id={`simulacao-detalhes-${simIndex}`} className={`bg-slate-50 rounded-xl p-6 border ${sim.arquivado ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'} ${hideOnPrintClass}`}>
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="bg-yellow-100 text-yellow-600 p-1.5 rounded-lg"><FileText size={20} /></span>
                            Detalhes do Empréstimo {selectedClient.simulacoes.length > 1 ? `#${selectedClient.simulacoes.length - simIndex}` : ''}
                          </h3>
                          <div className="flex items-center gap-2">
                            {sim.status === 'pendente' && (
                              <>
                                <button
                                  onClick={() => handleAprovarSimulacao(simIndex, true)}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                                >
                                  Aprovar (Sim)
                                </button>
                                <button
                                  onClick={() => handleAprovarSimulacao(simIndex, false)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                                >
                                  Reprovar (Não)
                                </button>
                              </>
                            )}
                            {(sim.status === 'aprovado' || !sim.status) && (
                              <>
                                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">Aprovado</span>
                                {sim.clientAccepted === 'sim' && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium ml-2">Aceito pelo Cliente</span>}
                                {sim.clientAccepted === 'nao' && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium ml-2">Recusado pelo Cliente</span>}
                                {!sim.clientAccepted && <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium ml-2">Aguardando Cliente</span>}
                              </>
                            )}
                            {sim.status === 'reprovado' && (
                              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">Reprovado</span>
                            )}
                            {sim.arquivado && (
                              <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm font-medium ml-2">Arquivado</span>
                            )}
                            <button
                              onClick={() => {
                                const updatedClients = clients.map(c => {
                                  if (c.id === selectedClient.id) {
                                    const updatedSimulacoes = [...c.simulacoes];
                                    updatedSimulacoes[simIndex] = { ...updatedSimulacoes[simIndex], arquivado: !updatedSimulacoes[simIndex].arquivado };
                                    const updatedClient = { ...c, simulacoes: updatedSimulacoes };
                                    setSelectedClient(updatedClient);
                                    
                                    fetch(`/api/clients/${updatedClient.id}`, {
                                      method: 'PUT',
                                      headers: { 
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${adminToken}`
                                      },
                                      body: JSON.stringify(updatedClient)
                                    }).catch(err => console.error("Erro ao arquivar:", err));
                                    
                                    return updatedClient;
                                  }
                                  return c;
                                });
                                setClients(updatedClients);
                              }}
                              className={`ml-2 p-2 rounded-lg transition-colors ${sim.arquivado ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                              title={sim.arquivado ? "Desarquivar Empréstimo" : "Arquivar Empréstimo"}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="21 8 21 21 3 21 3 8"></polyline>
                                <rect x="1" y="3" width="22" height="5"></rect>
                                <line x1="10" y1="12" x2="14" y2="12"></line>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleRenegociar()}
                              className="ml-2 text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Renegociar Empréstimo"
                            >
                              <RefreshCw size={18} />
                            </button>
                            <button
                              onClick={() => startEditingSimulacao(simIndex, sim)}
                              className="ml-2 text-indigo-500 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                              title="Editar Empréstimo"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                            </button>
                            <button
                              onClick={() => handleExcluirSimulacao(simIndex)}
                              className="ml-2 text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Excluir Empréstimo"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        
                        {editingSimIndex === simIndex ? (
                          <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm mb-6">
                            <h4 className="font-semibold text-indigo-800 mb-4">Editar Empréstimo</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Valor Solicitado (R$)</label>
                                <input
                                  type="number"
                                  value={editSimData.valorSolicitado}
                                  onChange={(e) => setEditSimData({...editSimData, valorSolicitado: e.target.value})}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Prazo</label>
                                <select
                                  value={editSimData.prazo}
                                  onChange={(e) => setEditSimData({...editSimData, prazo: e.target.value})}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                >
                                  <option value="dia">Diário</option>
                                  <option value="semanal">Semanal</option>
                                  <option value="quinzenal">Quinzenal</option>
                                  <option value="mensal">Mensal</option>
                                  <option value="única">Parcela Única</option>
                                </select>
                              </div>
                              {editSimData.prazo !== 'única' ? (
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade de Parcelas</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={editSimData.quantidade}
                                    onChange={(e) => setEditSimData({...editSimData, quantidade: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Data de Pagamento</label>
                                  <input
                                    type="date"
                                    value={editSimData.dataVencimentoUnica}
                                    onChange={(e) => setEditSimData({...editSimData, dataVencimentoUnica: e.target.value})}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                  />
                                </div>
                              )}
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Taxa de Juros ao Mês (%)
                                </label>
                                <input
                                  type="number"
                                  value={editSimData.taxaJuros}
                                  onChange={(e) => setEditSimData({...editSimData, taxaJuros: e.target.value})}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Data Inicial</label>
                                <input
                                  type="date"
                                  value={editSimData.dataInicial}
                                  onChange={(e) => setEditSimData({...editSimData, dataInicial: e.target.value})}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                              <button
                                onClick={cancelEditingSimulacao}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => saveEditingSimulacao(simIndex)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                              >
                                Salvar Alterações
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                              <div>
                                <p className="text-sm text-slate-500">Valor Solicitado</p>
                                <p className="text-lg font-semibold text-slate-800">{formatCurrency(sim.valorSolicitado)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500">Valor total a pagar</p>
                                <p className="text-lg font-semibold text-slate-800">{formatCurrency(calcularTotalAPagarAtualizado(sim))}</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500">Prazo</p>
                                <p className="text-lg font-semibold text-slate-800 capitalize">{sim.prazo}</p>
                              </div>
                              <div className="col-span-2 md:col-span-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200 print:hidden">
                                <p className="text-xs text-yellow-800 font-medium mb-1">Cálculo de Juros (Visão Admin)</p>
                                <p className="text-sm text-yellow-900">Taxa aplicada: {sim.taxaJuros}% ao mês</p>
                                <p className="text-xs text-yellow-700 mt-1">Fórmula: Valor Solicitado + (Valor Solicitado * Taxa de Juros * (Dias Totais / 30))</p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-semibold text-slate-700">Controle de Parcelas</h4>
                                <div className="flex gap-2 print:hidden">
                                    <button 
                                      onClick={() => {
                                        setPrintingSimIndex(simIndex);
                                        setTimeout(() => {
                                          window.print();
                                          setPrintingSimIndex(null);
                                        }, 100);
                                      }}
                                      className="flex items-center gap-2 bg-slate-600 text-white px-3 py-1.5 rounded-lg hover:bg-slate-500 transition-colors text-sm"
                                    >
                                      Imprimir
                                    </button>
                                <button 
                                  onClick={() => handleGeneratePDF(simIndex)}
                                  className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                                >
                                  <Download size={16} />
                                  Salvar PDF
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                          {sim.parcelas.map((p: any, i: number) => {
                            const hoje = new Date();
                            hoje.setHours(0,0,0,0);
                            const vencimento = parseLocalDate(p.dataVencimento);
                            vencimento.setHours(0,0,0,0);
                            
                            const isVencida = !p.paga && vencimento < hoje;
                            const isVencendoHoje = !p.paga && vencimento.getTime() === hoje.getTime();
                            
                            let diasAtraso = 0;
                            let valorAtualizado = p.valor;
                            const abatimentosTotal = p.abatimentos ? p.abatimentos.reduce((acc: number, a: any) => acc + a.valor, 0) : 0;
                            
                            if (isVencida) {
                              let dataBase = hoje;
                              if (p.jurosCongelados && p.dataCongelamento) {
                                const dataCongelamento = parseLocalDate(p.dataCongelamento);
                                dataCongelamento.setHours(0,0,0,0);
                                if (dataCongelamento < hoje) {
                                  dataBase = dataCongelamento;
                                }
                              }
                              const diffTime = Math.max(0, dataBase.getTime() - vencimento.getTime());
                              diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              const taxaDia = parseFloat(sim.taxaAtrasoDia) || 1;
                              valorAtualizado = p.valor + (p.valor * (taxaDia / 100) * diasAtraso);
                            }
                            
                            valorAtualizado = Math.max(0, valorAtualizado - abatimentosTotal);

                            const isEditing = editingParcela?.simIndex === simIndex && editingParcela?.parcelaIndex === i;

                            return (
                              <div key={i} className={`border rounded-lg p-4 ${isVencida ? 'border-red-300 bg-red-50' : p.paga ? 'border-emerald-200 bg-emerald-50' : isVencendoHoje ? 'border-yellow-400 bg-yellow-50' : 'border-slate-200 bg-white'}`}>
                                <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-800">Parcela {p.numero}</span>
                                    {!isEditing && (
                                      <button
                                        onClick={() => {
                                          setEditingParcela({ simIndex, parcelaIndex: i });
                                          setEditParcelaData({ 
                                            dataVencimento: p.dataVencimento, 
                                            valor: p.valor,
                                            dataPagamento: p.dataPagamento ? p.dataPagamento.split('T')[0] : ''
                                          });
                                        }}
                                        className="text-slate-400 hover:text-yellow-600 transition-colors ml-2"
                                        title="Editar Parcela"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                    )}
                                    {isVencendoHoje && (
                                      <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded animate-pulse">
                                        VENCE HOJE
                                      </span>
                                    )}
                                  </div>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={p.paga} 
                                      onChange={async () => {
                                        const updatedClients = clients.map(c => {
                                          if (c.id === selectedClient.id) {
                                            const updatedSimulacoes = [...c.simulacoes];
                                            const novasParcelas = [...updatedSimulacoes[simIndex].parcelas];
                                            const isNowPaid = !novasParcelas[i].paga;
                                            novasParcelas[i] = { 
                                              ...novasParcelas[i], 
                                              paga: isNowPaid,
                                              status: isNowPaid ? 'pago' : 'pendente',
                                              dataPagamento: isNowPaid ? getLocalISODateTime() : null
                                            };
                                            if (isNowPaid && isVencida) {
                                              novasParcelas[i].valor = valorAtualizado;
                                            }
                                            updatedSimulacoes[simIndex] = { ...updatedSimulacoes[simIndex], parcelas: novasParcelas };
                                            
                                            const updatedClient = {
                                              ...c,
                                              simulacoes: updatedSimulacoes
                                            };
                                            
                                            // Save to API
                                            fetch(`/api/clients/${c.id}`, {
                                              method: 'PUT',
                                              headers: { 
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${adminToken}`
                                              },
                                              body: JSON.stringify(updatedClient)
                                            })
                                            .then(res => {
                                              if (!res.ok) {
                                                alert('Erro ao atualizar status da parcela no banco de dados.');
                                              }
                                            })
                                            .catch(err => console.error("Erro ao atualizar cliente:", err));

                                            setSelectedClient(updatedClient);
                                            return updatedClient;
                                          }
                                          return c;
                                        });
                                        setClients(updatedClients);
                                      }}
                                      className="w-5 h-5 text-yellow-500 rounded focus:ring-yellow-500"
                                    />
                                    <span className={p.paga ? "text-emerald-600 font-medium" : "text-slate-500"}>
                                      {p.paga ? "Paga" : "Pendente"}
                                    </span>
                                  </label>
                                  
                                  {!p.paga && isVencida && (
                                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                                      <input
                                        type="checkbox"
                                        checked={p.jurosCongelados || false}
                                        onChange={(e) => {
                                          const isFrozen = e.target.checked;
                                          const updatedClients = clients.map(c => {
                                            if (c.id === selectedClient.id) {
                                              const updatedSimulacoes = [...(c.simulacoes || (c.simulacao ? [c.simulacao] : []))];
                                              const novasParcelas = [...updatedSimulacoes[simIndex].parcelas];
                                              novasParcelas[i] = { 
                                                ...novasParcelas[i], 
                                                jurosCongelados: isFrozen,
                                                dataCongelamento: isFrozen ? new Date().toISOString().split('T')[0] : undefined
                                              };
                                              updatedSimulacoes[simIndex] = { ...updatedSimulacoes[simIndex], parcelas: novasParcelas };
                                              
                                              const updatedClient = {
                                                ...c,
                                                simulacoes: updatedSimulacoes
                                              };
                                              
                                              // Save to API
                                              fetch(`/api/clients/${c.id}`, {
                                                method: 'PUT',
                                                headers: { 
                                                  'Content-Type': 'application/json',
                                                  'Authorization': `Bearer ${adminToken}`
                                                },
                                                body: JSON.stringify(updatedClient)
                                              })
                                              .then(res => {
                                                if (!res.ok) {
                                                  alert('Erro ao atualizar status da parcela no banco de dados.');
                                                }
                                              })
                                              .catch(err => console.error("Erro ao atualizar cliente:", err));

                                              setSelectedClient(updatedClient);
                                              return updatedClient;
                                            }
                                            return c;
                                          });
                                          setClients(updatedClients);
                                        }}
                                        className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                                      />
                                      <span className="text-blue-600 text-sm font-medium">
                                        Juros congelados
                                      </span>
                                    </label>
                                  )}
                                  
                                  {!p.paga && isVencida && p.jurosCongelados && (
                                    <div className="mt-2 text-sm bg-blue-50 p-2 rounded border border-blue-100">
                                      <label className="block text-blue-800 font-medium mb-1">Data de Congelamento:</label>
                                      <input
                                        type="date"
                                        value={p.dataCongelamento || ''}
                                        onChange={(e) => {
                                          const newDate = e.target.value;
                                          const updatedClients = clients.map(c => {
                                            if (c.id === selectedClient.id) {
                                              const updatedSimulacoes = [...(c.simulacoes || (c.simulacao ? [c.simulacao] : []))];
                                              const novasParcelas = [...updatedSimulacoes[simIndex].parcelas];
                                              novasParcelas[i] = { 
                                                ...novasParcelas[i], 
                                                dataCongelamento: newDate
                                              };
                                              updatedSimulacoes[simIndex] = { ...updatedSimulacoes[simIndex], parcelas: novasParcelas };
                                              
                                              const updatedClient = { ...c, simulacoes: updatedSimulacoes };
                                              
                                              // Save to API
                                              fetch(`/api/clients/${c.id}`, {
                                                method: 'PUT',
                                                headers: { 
                                                  'Content-Type': 'application/json',
                                                  'Authorization': `Bearer ${adminToken}`
                                                },
                                                body: JSON.stringify(updatedClient)
                                              }).catch(err => console.error("Erro ao atualizar data de congelamento:", err));

                                              setSelectedClient(updatedClient);
                                              return updatedClient;
                                            }
                                            return c;
                                          });
                                          setClients(updatedClients);
                                        }}
                                        className="w-full px-2 py-1 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700"
                                      />
                                      <p className="text-xs text-blue-600 mt-1 leading-tight">O valor será congelado com os juros calculados até esta data.</p>
                                    </div>
                                  )}
                                </div>
                                {isEditing ? (
                                  <div className="grid grid-cols-2 gap-2 text-sm mt-2 bg-slate-50 p-2 rounded border border-slate-200">
                                    <div>
                                      <label className="block text-xs text-slate-500 mb-1">Vencimento</label>
                                      <input
                                        type="date"
                                        value={editParcelaData.dataVencimento}
                                        onChange={(e) => setEditParcelaData({ ...editParcelaData, dataVencimento: e.target.value })}
                                        className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-yellow-500 outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-slate-500 mb-1">Valor (R$)</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={editParcelaData.valor}
                                        onChange={(e) => setEditParcelaData({ ...editParcelaData, valor: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-yellow-500 outline-none"
                                      />
                                    </div>
                                    {p.paga && (
                                      <div className="col-span-2">
                                        <label className="block text-xs text-slate-500 mb-1">Data de Pagamento</label>
                                        <input
                                          type="date"
                                          value={editParcelaData.dataPagamento}
                                          onChange={(e) => setEditParcelaData({ ...editParcelaData, dataPagamento: e.target.value })}
                                          className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-yellow-500 outline-none"
                                        />
                                      </div>
                                    )}
                                    <div className="col-span-2 flex justify-end gap-2 mt-2">
                                      <button
                                        onClick={() => setEditingParcela(null)}
                                        className="px-3 py-1 text-xs font-medium text-slate-600 bg-slate-200 hover:bg-slate-300 rounded transition-colors"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        onClick={async () => {
                                          const updatedClients = clients.map(c => {
                                            if (c.id === selectedClient.id) {
                                              const updatedSimulacoes = [...c.simulacoes];
                                              const novasParcelas = [...updatedSimulacoes[simIndex].parcelas];
                                              novasParcelas[i] = { 
                                                ...novasParcelas[i], 
                                                dataVencimento: editParcelaData.dataVencimento, 
                                                valor: editParcelaData.valor,
                                                ...(p.paga && editParcelaData.dataPagamento ? { dataPagamento: editParcelaData.dataPagamento + 'T12:00:00.000Z' } : {})
                                              };
                                              updatedSimulacoes[simIndex] = { ...updatedSimulacoes[simIndex], parcelas: novasParcelas };
                                              
                                              const updatedClient = {
                                                ...c,
                                                simulacoes: updatedSimulacoes
                                              };
                                              
                                              fetch(`/api/clients/${c.id}`, {
                                                method: 'PUT',
                                                headers: { 
                                                  'Content-Type': 'application/json',
                                                  'Authorization': `Bearer ${adminToken}`
                                                },
                                                body: JSON.stringify(updatedClient)
                                              })
                                              .then(res => {
                                                if (res.ok) {
                                                  alert('Parcela atualizada com sucesso!');
                                                } else {
                                                  alert('Erro ao atualizar parcela no banco de dados.');
                                                }
                                              })
                                              .catch(err => {
                                                console.error("Erro ao atualizar cliente:", err);
                                                alert('Erro de conexão ao atualizar parcela.');
                                              });

                                              setSelectedClient(updatedClient);
                                              return updatedClient;
                                            }
                                            return c;
                                          });
                                          setClients(updatedClients);
                                          setEditingParcela(null);
                                        }}
                                        className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded transition-colors"
                                      >
                                        <Save size={12} />
                                        Salvar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-slate-500">Vencimento:</span> {formatDate(p.dataVencimento)}
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Valor:</span> {formatCurrency(p.valor)}
                                    </div>
                                    {p.paga && p.dataPagamento && (
                                      <div className="col-span-2 text-emerald-600 font-medium">
                                        <span className="text-slate-500">Pago em:</span> {formatDate(p.dataPagamento.split('T')[0])}
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {!isEditing && (
                                  <div className="mt-3 pt-3 border-t border-slate-200">
                                    <div className="flex justify-between items-center mb-2">
                                      <h5 className="text-sm font-semibold text-slate-700">Abatimentos</h5>
                                      {!p.paga && (
                                        <button
                                          onClick={() => setAddingAbatimento({ simIndex, parcelaIndex: i })}
                                          className="text-xs text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
                                        >
                                          <Plus size={12} /> Adicionar
                                        </button>
                                      )}
                                    </div>
                                    
                                    {p.abatimentos && p.abatimentos.length > 0 ? (
                                      <div className="space-y-1 mb-2">
                                        {p.abatimentos.map((abatimento: any, aIdx: number) => (
                                          <div key={aIdx} className="flex justify-between text-xs text-slate-600 bg-slate-50 p-1.5 rounded">
                                            <span>{formatDate(abatimento.data)}</span>
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium text-emerald-600">{formatCurrency(abatimento.valor)}</span>
                                              {!p.paga && (
                                                <button 
                                                  onClick={() => handleRemoveAbatimento(simIndex, i, aIdx)}
                                                  className="text-red-400 hover:text-red-600"
                                                >
                                                  <Trash2 size={12} />
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                        <div className="flex justify-between text-xs font-semibold text-slate-700 pt-1 border-t border-slate-200 mt-1">
                                          <span>Total Abatido:</span>
                                          <span className="text-emerald-600">{formatCurrency(p.abatimentos.reduce((acc: number, a: any) => acc + a.valor, 0))}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold text-slate-800 pt-1">
                                          <span>Restante:</span>
                                          <span>{formatCurrency(valorAtualizado)}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-500 italic">Nenhum abatimento registrado.</p>
                                    )}

                                    {addingAbatimento?.simIndex === simIndex && addingAbatimento?.parcelaIndex === i && (
                                      <div className="mt-2 bg-yellow-50 p-2 rounded border border-yellow-200 grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-xs text-slate-600 mb-1">Data</label>
                                          <input 
                                            type="date" 
                                            value={newAbatimento.data}
                                            onChange={(e) => setNewAbatimento({...newAbatimento, data: e.target.value})}
                                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:border-yellow-500"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs text-slate-600 mb-1">Valor (R$)</label>
                                          <input 
                                            type="number" 
                                            step="0.01"
                                            value={newAbatimento.valor}
                                            onChange={(e) => setNewAbatimento({...newAbatimento, valor: e.target.value})}
                                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:border-yellow-500"
                                          />
                                        </div>
                                        <div className="col-span-2 flex justify-end gap-2 mt-1">
                                          <button 
                                            onClick={() => setAddingAbatimento(null)}
                                            className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                                          >
                                            Cancelar
                                          </button>
                                          <button 
                                            onClick={() => handleAddAbatimento(simIndex, i)}
                                            className="px-2 py-1 text-xs bg-yellow-500 text-white hover:bg-yellow-600 rounded"
                                          >
                                            Salvar
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {isVencida && !isEditing && (
                                  <div className="mt-3 pt-3 border-t border-red-200">
                                    <div className="text-red-600 font-semibold mb-1 text-sm flex items-center gap-1">
                                      ⚠️ Parcela Vencida
                                    </div>
                                    <div className="grid grid-cols-2 gap-1 text-xs text-red-800">
                                      <div>Atraso: {diasAtraso} dias</div>
                                      <div>Taxa: {diasAtraso * (parseFloat(sim.taxaAtrasoDia) || 1)}%</div>
                                      <div className="col-span-2 font-bold text-sm mt-1">
                                        Valor Atualizado: {formatCurrency(valorAtualizado)}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {isVencida && !isEditing && (
                                  <div className="mt-3 pt-3 border-t border-red-200 print:hidden">
                                    <a 
                                      href={`https://wa.me/55${selectedClient.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${selectedClient.nomeCompleto.split(' ')[0]}, a GM-Empréstimo informa que sua Parcela ${p.numero} está VENCIDA desde ${formatDate(p.dataVencimento)}. ${p.jurosCongelados ? `O valor para pagamento é de ${formatCurrency(valorAtualizado)}.` : `O valor atualizado com juros de atraso (${diasAtraso} dias) é de ${formatCurrency(valorAtualizado)}.`} Por favor, regularize o quanto antes para evitar maiores encargos.`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex justify-center items-center gap-2 w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                                    >
                                      <Phone size={16} />
                                      Notificar Parcela Vencida via WhatsApp
                                    </a>
                                  </div>
                                )}

                                {isVencendoHoje && (
                                  <div className="mt-3 pt-3 border-t border-yellow-200 print:hidden">
                                    <a 
                                      href={`https://wa.me/55${selectedClient.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${selectedClient.nomeCompleto.split(' ')[0]}, a GM-Empréstimo informa que sua Parcela ${p.numero} no valor de ${formatCurrency(valorAtualizado)} vence hoje, ${formatDate(p.dataVencimento)}. O pagamento deve ser realizado até as 18 horas via Pix. Nossa chave Pix: 31972323040 (Silmara).`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex justify-center items-center gap-2 w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                                    >
                                      <Phone size={16} />
                                      Notificar Vencimento Hoje via WhatsApp
                                    </a>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="mt-6 pt-6 border-t border-slate-200 print:hidden">
                          <h4 className="font-semibold text-slate-700 mb-2">Anotações do Empréstimo</h4>
                          <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none resize-y min-h-[100px]"
                            placeholder="Adicione anotações sobre este empréstimo..."
                            value={sim.anotacoes || ''}
                            onChange={(e) => {
                              const updatedClients = clients.map(c => {
                                if (c.id === selectedClient.id) {
                                  const updatedSimulacoes = [...c.simulacoes];
                                  updatedSimulacoes[simIndex] = { ...updatedSimulacoes[simIndex], anotacoes: e.target.value };
                                  const updatedClient = { ...c, simulacoes: updatedSimulacoes };
                                  setSelectedClient(updatedClient);
                                  return updatedClient;
                                }
                                return c;
                              });
                              setClients(updatedClients);
                            }}
                            onBlur={() => {
                              const clientToUpdate = clients.find(c => c.id === selectedClient.id);
                              if (clientToUpdate) {
                                fetch(`/api/clients/${clientToUpdate.id}`, {
                                  method: 'PUT',
                                  headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${adminToken}`
                                  },
                                  body: JSON.stringify(clientToUpdate)
                                }).catch(err => console.error("Erro ao salvar anotações:", err));
                              }
                            }}
                          />
                          <p className="text-xs text-slate-500 mt-1">As anotações são salvas automaticamente ao sair do campo.</p>
                        </div>
                        </>
                        )}
                      </div>
                      );
                    })}
                  </div>
                ) : selectedClient.simulacao && selectedClient.simulacao.valorSolicitado ? (
                  <div className="md:col-span-2 mt-4">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                      <span className="bg-yellow-100 text-yellow-600 p-1.5 rounded-lg"><FileText size={20} /></span>
                      Detalhes do Empréstimo (Legado)
                    </h3>
                    <p className="text-slate-500 text-sm">Este cliente possui um empréstimo no formato antigo. Por favor, atualize os dados se necessário.</p>
                  </div>
                ) : (
                  <div className="md:col-span-2 mt-4 bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-200 text-slate-500 mb-4">
                      <FileText size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Sem Empréstimos</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                      Este cliente preencheu apenas a ficha de cadastro e ainda não possui nenhuma simulação de empréstimo.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : !selectedClient && adminTab === 'clientes' ? (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      placeholder="Buscar clientes por nome ou CPF..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                    />
                  </div>
                  <div className="w-full md:w-64">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none transition-all bg-white"
                    >
                      <option value="todos">Todos os Status</option>
                      <option value="qualquer_atraso">Qualquer Atraso</option>
                      <option value="inadimplente_antigo">Inadimplente Antigo (&gt; 60 dias)</option>
                      <option value="muito_atrasado">+30 Dias Atraso</option>
                      <option value="atrasado">Atrasado (1 a 30 dias)</option>
                      <option value="vence_hoje">Vence Hoje</option>
                      <option value="em_dia">Em Dia</option>
                      <option value="em_analise">Em Análise</option>
                      <option value="aguardando_aceite">Aguardando Aceite</option>
                      <option value="reprovado">Reprovado</option>
                      <option value="sem_pendencias">Sem Pendências</option>
                    </select>
                  </div>
                </div>
              </div>
              {(() => {
                const filteredClients = clients
                  .filter(c => c.id !== 'admin-transactions')
                  .filter(c => c.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) || c.cpf.includes(searchTerm))
                  .filter(c => {
                    if (statusFilter === 'todos') return true;
                    const status = getClientStatus(c);
                    if (statusFilter === 'qualquer_atraso') {
                      return ['atrasado', 'muito_atrasado', 'inadimplente_antigo'].includes(status);
                    }
                    return status === statusFilter;
                  })
                  .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto));

                return filteredClients.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="py-4 px-6 font-semibold text-slate-700">Status</th>
                        <th className="py-4 px-6 font-semibold text-slate-700">Nome do Cliente</th>
                        <th className="py-4 px-6 font-semibold text-slate-700">CPF</th>
                        <th className="py-4 px-6 font-semibold text-slate-700">Telefone</th>
                        <th className="py-4 px-6 font-semibold text-slate-700">Valor total a pagar</th>
                        <th className="py-4 px-6 font-semibold text-slate-700">Data de Cadastro</th>
                        <th className="py-4 px-6 font-semibold text-slate-700">Documentos</th>
                        <th className="py-4 px-6 font-semibold text-slate-700 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map(client => {
                        const status = getClientStatus(client);
                        const statusDisplay = getStatusDisplay(status);
                        return (
                        <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color} ${statusDisplay.text}`}>
                              {statusDisplay.label}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-medium text-slate-800">
                            <div className="flex items-center gap-2">
                              {client.nomeCompleto}
                              {client.simulacoes?.some((s: any) => s.status === 'pendente') && (
                                <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">Análise Pendente</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-600">{client.cpf}</td>
                          <td className="py-4 px-6 text-slate-600">{client.telefone}</td>
                          <td className="py-4 px-6 font-semibold text-slate-800">
                            {formatCurrency((client.simulacoes || (client.simulacao ? [client.simulacao] : []))
                              .filter((s: any) => s.status !== 'pendente' && s.status !== 'reprovado' && s.status !== 'renegociado')
                              .reduce((acc: number, sim: any) => acc + calcularTotalAPagarAtualizado(sim), 0))}
                          </td>
                          <td className="py-4 px-6 text-slate-600">{client.dataCadastro}</td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium">
                              <ImageIcon size={14} />
                              {client.arquivos?.length || 0} arquivos
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button 
                                onClick={() => setSelectedClient(client)}
                                className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                              >
                                Ver Detalhes
                              </button>
                              <button 
                                onClick={() => setClientToDelete(client)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                title="Excluir cliente"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <Users size={64} className="text-slate-300 mb-4" />
                  <h3 className="text-xl font-medium text-slate-700 mb-2">
                    {clients.filter(c => c.id !== 'admin-transactions').length === 0 
                      ? 'Nenhum cliente cadastrado' 
                      : 'Nenhum cliente encontrado'}
                  </h3>
                  <p className="text-slate-500">
                    {clients.filter(c => c.id !== 'admin-transactions').length === 0 
                      ? 'Os clientes que preencherem o formulário aparecerão aqui.' 
                      : 'Tente buscar por outro nome ou CPF.'}
                  </p>
                </div>
              );
              })()}
            </div>
          ) : null}

          {!selectedClient && adminTab === 'cronograma' && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Calendar size={24} className="text-yellow-500" />
                  Cronograma de Clientes
                </h2>
                <div className="flex gap-2">
                  <select 
                    value={cronogramaStatusFilter}
                    onChange={(e) => setCronogramaStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="vencidas">Vencidas</option>
                    <option value="hoje">Vencendo Hoje</option>
                    <option value="a_vencer">A Vencer</option>
                  </select>
                  <select 
                    value={cronogramaMonth}
                    onChange={(e) => setCronogramaMonth(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                  >
                    <option value="all">Ano Todo</option>
                    <option value="01">Janeiro</option>
                    <option value="02">Fevereiro</option>
                    <option value="03">Março</option>
                    <option value="04">Abril</option>
                    <option value="05">Maio</option>
                    <option value="06">Junho</option>
                    <option value="07">Julho</option>
                    <option value="08">Agosto</option>
                    <option value="09">Setembro</option>
                    <option value="10">Outubro</option>
                    <option value="11">Novembro</option>
                    <option value="12">Dezembro</option>
                  </select>
                  <select 
                    value={cronogramaYear}
                    onChange={(e) => setCronogramaYear(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                  >
                    <option value="all">Todos os Anos</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                    <option value="2029">2029</option>
                    <option value="2030">2030</option>
                  </select>
                </div>
              </div>

              {Object.keys(groupedCronograma).length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(groupedCronograma).map(([date, parcelas]: [string, any[]]) => {
                    const hoje = new Date();
                    hoje.setHours(0,0,0,0);
                    const vencimento = parseLocalDate(date);
                    vencimento.setHours(0,0,0,0);
                    const isVencida = vencimento < hoje;
                    const isVencendoHoje = vencimento.getTime() === hoje.getTime();
                    
                    let dateLabel = formatDate(date);
                    let dateColor = 'text-slate-700 bg-slate-100';
                    
                    if (isVencendoHoje) {
                      dateLabel += ' (Vence Hoje)';
                      dateColor = 'text-yellow-800 bg-yellow-100 border-yellow-200';
                    } else if (isVencida) {
                      dateLabel += ' (Vencida)';
                      dateColor = 'text-red-800 bg-red-100 border-red-200';
                    } else {
                      dateLabel += ' (A Vencer)';
                      dateColor = 'text-blue-800 bg-blue-100 border-blue-200';
                    }

                    return (
                      <div key={date} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className={`px-6 py-3 border-b font-semibold flex items-center gap-2 ${dateColor}`}>
                          <Calendar size={18} />
                          {dateLabel}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="py-3 px-6 font-semibold text-slate-700">Cliente</th>
                                <th className="py-3 px-6 font-semibold text-slate-700">Telefone</th>
                                <th className="py-3 px-6 font-semibold text-slate-700">Parcela</th>
                                <th className="py-3 px-6 font-semibold text-slate-700">Valor</th>
                                <th className="py-3 px-6 font-semibold text-slate-700 text-right">Ação</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parcelas.map((p, idx) => (
                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                  <td className="py-3 px-6 font-medium text-slate-800">{p.clientName}</td>
                                  <td className="py-3 px-6 text-slate-600">{p.clientPhone}</td>
                                  <td className="py-3 px-6 text-slate-600">{p.numero}</td>
                                  <td className="py-3 px-6 text-slate-600">{formatCurrency(p.valorRestante)}</td>
                                  <td className="py-3 px-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <a 
                                        href={`https://wa.me/55${p.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                          (() => {
                                            if (isVencendoHoje) {
                                              return `Olá ${p.clientName.split(' ')[0]}, a GM-Empréstimo informa que sua Parcela ${p.numero} no valor de ${formatCurrency(p.valorRestante)} vence hoje, ${formatDate(p.dataVencimento)}. O pagamento deve ser realizado até as 18 horas via Pix. Nossa chave Pix: 31972323040 (Silmara).`;
                                            } else if (isVencida) {
                                              let dataBase = hoje;
                                              if (p.jurosCongelados && p.dataCongelamento) {
                                                const dataCongelamento = parseLocalDate(p.dataCongelamento);
                                                dataCongelamento.setHours(0,0,0,0);
                                                if (dataCongelamento < hoje) {
                                                  dataBase = dataCongelamento;
                                                }
                                              }
                                              const diffTime = Math.max(0, dataBase.getTime() - vencimento.getTime());
                                              const diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                              const taxaDia = parseFloat(p.taxaAtrasoDia) || parseFloat(adminSettings.taxaAtrasoDia) || 1;
                                              const abatimentosTotal = p.abatimentos ? p.abatimentos.reduce((acc: number, a: any) => acc + a.valor, 0) : 0;
                                              let valorAtualizado = p.valor + (p.valor * (taxaDia / 100) * diasAtraso);
                                              valorAtualizado = Math.max(0, valorAtualizado - abatimentosTotal);
                                              return `Olá ${p.clientName.split(' ')[0]}, a GM-Empréstimo informa que sua Parcela ${p.numero} está VENCIDA desde ${formatDate(p.dataVencimento)}. ${p.jurosCongelados ? `O valor para pagamento é de ${formatCurrency(valorAtualizado)}.` : `O valor atualizado com juros de atraso (${diasAtraso} dias) é de ${formatCurrency(valorAtualizado)}.`} Por favor, regularize o quanto antes para evitar maiores encargos.`;
                                            }
                                            return `Olá ${p.clientName.split(' ')[0]}, a GM-Empréstimo lembra que sua Parcela ${p.numero} no valor de ${formatCurrency(p.valorRestante)} vencerá em ${formatDate(p.dataVencimento)}.`;
                                          })()
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 transition-colors"
                                        title="Notificar via WhatsApp"
                                      >
                                        <Phone size={18} />
                                      </a>
                                      <button 
                                        onClick={() => {
                                          const client = clients.find(c => c.id === p.clientId);
                                          if (client) {
                                            setSelectedClient(client);
                                            setAdminTab('clientes');
                                          }
                                        }}
                                        className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                                      >
                                        Ver Cliente
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <Calendar size={64} className="text-slate-300 mb-4" />
                  <h3 className="text-xl font-medium text-slate-700 mb-2">Nenhuma parcela encontrada</h3>
                  <p className="text-slate-500">Não há vencimentos para os filtros selecionados.</p>
                </div>
              )}
            </div>
          )}

          {!selectedClient && adminTab === 'fluxo_caixa' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp size={24} className="text-yellow-500" />
                    Fluxo de Caixa
                  </h2>
                  <div className="flex gap-2">
                    <select 
                      value={fluxoTypeFilter}
                      onChange={(e) => setFluxoTypeFilter(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                    >
                      <option value="all">Todos os Tipos</option>
                      <option value="entrada">Entradas (Pagamentos)</option>
                      <option value="saida">Saídas (Empréstimos)</option>
                      <option value="retirada">Retiradas / Despesas</option>
                      <option value="aporte">Aportes</option>
                      <option value="entrada_prevista">Previsto</option>
                    </select>
                    <select 
                      value={fluxoMonth}
                      onChange={(e) => setFluxoMonth(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                    >
                      <option value="all">Ano Todo</option>
                      <option value="01">Janeiro</option>
                      <option value="02">Fevereiro</option>
                      <option value="03">Março</option>
                      <option value="04">Abril</option>
                      <option value="05">Maio</option>
                      <option value="06">Junho</option>
                      <option value="07">Julho</option>
                      <option value="08">Agosto</option>
                      <option value="09">Setembro</option>
                      <option value="10">Outubro</option>
                      <option value="11">Novembro</option>
                      <option value="12">Dezembro</option>
                    </select>
                    <select 
                      value={fluxoYear}
                      onChange={(e) => setFluxoYear(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                    >
                      {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                  <div className={`border p-4 rounded-xl flex flex-col justify-between ${fundoDeCaixa >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Landmark size={18} className={fundoDeCaixa >= 0 ? 'text-blue-600' : 'text-rose-600'} />
                      <p className={`text-xs font-semibold uppercase tracking-wider ${fundoDeCaixa >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>Fundo de Caixa (Acumulado)</p>
                    </div>
                    <p className={`text-xl font-bold ${fundoDeCaixa >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>{formatCurrency(fundoDeCaixa)}</p>
                    <p className={`text-[10px] mt-1 ${fundoDeCaixa >= 0 ? 'text-blue-500' : 'text-rose-500'}`}>Saldo total até o período</p>
                  </div>

                  <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowUpRight size={18} className="text-green-600" />
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Entradas Efetivadas</p>
                    </div>
                    <p className="text-xl font-bold text-green-700">{formatCurrency(monthEntradas)}</p>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={18} className="text-yellow-600" />
                      <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Entradas Pendentes</p>
                    </div>
                    <p className="text-xl font-bold text-yellow-700">{formatCurrency(monthPendentes)}</p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <PiggyBank size={18} className="text-emerald-600" />
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Aportes (Capital)</p>
                    </div>
                    <p className="text-xl font-bold text-emerald-700">{formatCurrency(monthAportes)}</p>
                  </div>

                  <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowDownRight size={18} className="text-red-600" />
                      <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Saídas (Empréstimos)</p>
                    </div>
                    <p className="text-xl font-bold text-red-700">{formatCurrency(monthSaidas)}</p>
                  </div>

                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard size={18} className="text-orange-600" />
                      <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Retiradas / Despesas</p>
                    </div>
                    <p className="text-xl font-bold text-orange-700">{formatCurrency(monthRetiradas)}</p>
                  </div>

                  <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={18} className="text-rose-600" />
                      <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Inadimplência (Período)</p>
                    </div>
                    <p className="text-xl font-bold text-rose-700">{formatCurrency(monthInadimplencia)}</p>
                  </div>

                  <div className={`border p-4 rounded-xl flex flex-col justify-between ${saldo >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet size={18} className={saldo >= 0 ? 'text-indigo-600' : 'text-rose-600'} />
                      <p className={`text-xs font-semibold uppercase tracking-wider ${saldo >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>Saldo do Período</p>
                    </div>
                    <p className={`text-xl font-bold ${saldo >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>{formatCurrency(saldo)}</p>
                    <p className={`text-[10px] mt-1 ${saldo >= 0 ? 'text-indigo-500' : 'text-rose-500'}`}>Entradas + Aportes - Saídas - Retiradas</p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Registrar Movimentação (Admin)</h3>
                  <form onSubmit={handleAddRetirada} className="flex flex-wrap gap-4 items-end">
                    <div className="w-48">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                      <select 
                        value={newRetirada.tipo}
                        onChange={(e) => setNewRetirada({...newRetirada, tipo: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                      >
                        <option value="retirada">Retirada / Despesa</option>
                        <option value="aporte">Aporte (Entrada)</option>
                      </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                      <input 
                        type="text" 
                        value={newRetirada.descricao}
                        onChange={(e) => setNewRetirada({...newRetirada, descricao: e.target.value})}
                        placeholder={newRetirada.tipo === 'aporte' ? "Ex: Investimento inicial, Aporte dos sócios..." : "Ex: Pagamento de contas, Retirada de lucro..."}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                        required
                      />
                    </div>
                    <div className="w-40">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={newRetirada.valor}
                        onChange={(e) => setNewRetirada({...newRetirada, valor: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                        required
                      />
                    </div>
                    <div className="w-40">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                      <input 
                        type="date" 
                        value={newRetirada.data}
                        onChange={(e) => setNewRetirada({...newRetirada, data: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                        required
                      />
                    </div>
                    <button 
                      type="submit"
                      className={`flex items-center gap-2 text-white px-6 py-2 rounded-lg transition-colors font-medium h-[42px] ${newRetirada.tipo === 'aporte' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-800 hover:bg-slate-700'}`}
                    >
                      <Plus size={20} />
                      Registrar
                    </button>
                  </form>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Histórico de Movimentações ({fluxoMonth === 'all' ? fluxoYear : `${fluxoMonth}/${fluxoYear}`})</h3>
                {transactionsWithBalance.filter((t: any) => t.data.startsWith(fluxoFilter) && (fluxoTypeFilter === 'all' || t.tipo === fluxoTypeFilter)).length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(
                      [...transactionsWithBalance]
                        .filter((t: any) => t.data.startsWith(fluxoFilter) && (fluxoTypeFilter === 'all' || t.tipo === fluxoTypeFilter))
                        .sort((a: any, b: any) => {
                          const dateA = new Date(a.data).getTime();
                          const dateB = new Date(b.data).getTime();
                          if (dateA !== dateB) return dateA - dateB;
                          const descA = a.descricao || '';
                          const descB = b.descricao || '';
                          return descA.localeCompare(descB);
                        })
                        .reduce((acc: any, t: any) => {
                          const dateKey = t.data.split('T')[0];
                          if (!acc[dateKey]) acc[dateKey] = [];
                          acc[dateKey].push(t);
                          return acc;
                        }, {})
                    )
                    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                    .map(([date, transactions]: [string, any]) => (
                      <div key={date} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-6 last:mb-0">
                        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-slate-700">
                          {formatDate(date)}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-xs">
                                <th className="py-2 px-4 font-semibold text-slate-600">Tipo</th>
                                <th className="py-2 px-4 font-semibold text-slate-600">Descrição Detalhada</th>
                                <th className="py-2 px-4 font-semibold text-slate-600 text-right">Valor</th>
                                <th className="py-2 px-4 font-semibold text-slate-600 text-right">Saldo</th>
                                <th className="py-2 px-4 font-semibold text-slate-600 text-center">Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transactions.map((t: any, idx: number) => (
                                <tr key={t.id || idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${
                                      t.tipo === 'aporte' ? 'bg-emerald-100 text-emerald-700' : 
                                      t.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 
                                      t.tipo === 'entrada_prevista' ? 'bg-yellow-100 text-yellow-700' : 
                                      t.tipo === 'saida' ? 'bg-red-100 text-red-700' : 
                                      'bg-orange-100 text-orange-700'
                                    }`}>
                                      {t.tipo === 'aporte' ? 'Aporte' : 
                                       t.tipo === 'entrada' ? 'Entrada' : 
                                       t.tipo === 'entrada_prevista' ? 'Previsto' : 
                                       t.tipo === 'saida' ? 'Saída' : 
                                       'Retirada'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="text-slate-800 font-semibold">{t.descricao}</div>
                                    <div className="text-xs text-slate-500">{t.detalhes}</div>
                                  </td>
                                  <td className={`py-3 px-4 text-right font-bold ${['aporte', 'entrada', 'entrada_prevista'].includes(t.tipo) ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {['aporte', 'entrada', 'entrada_prevista'].includes(t.tipo) ? '+' : '-'} {formatCurrency(t.valor)}
                                  </td>
                                  <td className="py-3 px-4 text-right font-medium text-slate-600 bg-slate-50/50">
                                    {t.tipo === 'entrada_prevista' ? '-' : formatCurrency(t.saldoApos)}
                                  </td>
                                  <td className="py-3 px-4">
                                    {t.tipo !== 'entrada_prevista' && (
                                      <div className="flex justify-center gap-2">
                                        <button 
                                          onClick={() => handleEditFluxoItem(t)}
                                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                                          title="Editar / Corrigir"
                                        >
                                          <Edit2 size={16} />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteFluxoItem(t)}
                                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                                          title="Excluir Lançamento"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">Nenhuma movimentação registrada neste ano.</p>
                )}
              </div>
            </div>
          )}

          {adminTab === 'mensagens' && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 flex flex-col md:flex-row gap-6 h-[600px]">
              {/* Chat List */}
              <div className="w-full md:w-1/3 border-r border-slate-200 pr-6 flex flex-col">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <MessageSquare size={24} className="text-yellow-500" />
                  Conversas
                </h2>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {(() => {
                    let displayChats = [...adminChats];
                    if (selectedClient && !displayChats.find(c => c.id === selectedClient.id)) {
                      displayChats.unshift({
                        id: selectedClient.id,
                        clientName: selectedClient.nomeCompleto,
                        lastMessage: 'Nova conversa...',
                        lastMessageTimestamp: new Date().toISOString(),
                        lastSender: '',
                        unreadAdmin: 0,
                        unreadClient: 0
                      });
                    }
                    return displayChats.length === 0 ? (
                      <p className="text-slate-500 text-center py-4 text-sm">Nenhuma conversa encontrada.</p>
                    ) : (
                      displayChats.map(chat => (
                      <button
                        key={chat.id}
                        onClick={() => {
                          const client = clients.find(c => c.id === chat.id);
                          if (client) {
                            setSelectedClient(client);
                            fetchMessages(chat.id);
                            markChatAsRead(chat.id, 'admin');
                          }
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-colors flex items-start gap-3 ${selectedClient?.id === chat.id ? 'bg-yellow-50 border border-yellow-200' : 'hover:bg-slate-50 border border-transparent'}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-600 font-bold">
                          {chat.clientName ? chat.clientName.charAt(0).toUpperCase() : <User size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <h4 className="font-bold text-slate-800 truncate text-sm">{chat.clientName || 'Cliente'}</h4>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                              {chat.lastMessageTimestamp ? new Date(chat.lastMessageTimestamp).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <p className={`text-xs truncate ${chat.unreadAdmin > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                            {chat.lastSender === 'admin' ? 'Você: ' : ''}{chat.lastMessage}
                          </p>
                        </div>
                        {chat.unreadAdmin > 0 && (
                          <div className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-2">
                            {chat.unreadAdmin}
                          </div>
                        )}
                      </button>
                    ))
                  );
                })()}
                </div>
              </div>

              {/* Chat Window */}
              <div className="flex-1 flex flex-col bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                {selectedClient ? (
                  <>
                    <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold">
                          {selectedClient.nomeCompleto.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">{selectedClient.nomeCompleto}</h3>
                          <p className="text-xs text-slate-500">CPF: {selectedClient.cpf}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => deleteChat(selectedClient.id)} 
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="Apagar conversa"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-slate-600">
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-slate-500 my-auto">
                          <MessageCircle size={48} className="mx-auto text-slate-300 mb-2" />
                          <p>Nenhuma mensagem nesta conversa.</p>
                        </div>
                      ) : (
                        chatMessages.map((msg, idx) => (
                          <div key={idx} className={`flex flex-col max-w-[75%] group ${msg.sender === 'admin' ? 'self-end items-end' : 'self-start items-start'}`}>
                            <div className={`px-4 py-2 rounded-2xl ${msg.sender === 'admin' ? 'bg-yellow-500 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                              {msg.text}
                            </div>
                            <div className={`flex items-center gap-2 mt-1 px-1 ${msg.sender === 'admin' ? 'flex-row-reverse' : ''}`}>
                              <span className="text-[10px] text-slate-400">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <button
                                onClick={() => deleteMessage(selectedClient.id, msg.id)}
                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Apagar mensagem"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    
                    <div className="p-4 bg-white border-t border-slate-200">
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          sendMessage(selectedClient.id, chatInput, 'admin', selectedClient.nomeCompleto);
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Digite sua mensagem para o cliente..."
                          className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                        />
                        <button 
                          type="submit"
                          disabled={!chatInput.trim()}
                          className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-slate-300 text-white p-2 rounded-full transition-colors flex-shrink-0"
                        >
                          <Send size={20} />
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <MessageSquare size={64} className="mb-4 text-slate-300" />
                    <p className="text-lg font-medium text-slate-500">Selecione uma conversa</p>
                    <p className="text-sm">Escolha um cliente na lista ao lado para ver as mensagens.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {clientToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Excluir Cliente</h3>
              <p className="text-slate-600 text-center mb-6">
                Tem certeza que deseja excluir o cliente <span className="font-semibold">{clientToDelete.nomeCompleto}</span>? Esta ação não poderá ser desfeita.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setClientToDelete(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleDeleteClient(clientToDelete.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {editingTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
              <button 
                onClick={() => setEditingTransaction(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Edit2 size={24} className="text-yellow-500" />
                Corrigir Lançamento
              </h3>
              
              <form onSubmit={handleSaveFluxoEdit} className="space-y-4">
                {['aporte', 'retirada'].includes(editingTransaction.tipo) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                    <select 
                      value={editTransactionData.tipo}
                      onChange={(e) => setEditTransactionData({...editTransactionData, tipo: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                    >
                      <option value="retirada">Retirada / Despesa</option>
                      <option value="aporte">Aporte (Entrada)</option>
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                  <input 
                    type="text" 
                    value={editTransactionData.descricao}
                    onChange={(e) => setEditTransactionData({...editTransactionData, descricao: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                    disabled={!['aporte', 'retirada'].includes(editingTransaction.tipo)}
                    required
                  />
                  {!['aporte', 'retirada'].includes(editingTransaction.tipo) && (
                    <p className="text-[10px] text-slate-400 mt-1">Descrição de lançamentos automáticos não pode ser alterada.</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={editTransactionData.valor}
                      onChange={(e) => setEditTransactionData({...editTransactionData, valor: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                    <input 
                      type="date" 
                      value={editTransactionData.data}
                      onChange={(e) => setEditTransactionData({...editTransactionData, data: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                      required
                    />
                  </div>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setEditingTransaction(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'simulation') {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans relative">
        <div className="absolute top-4 left-4 flex gap-3">
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-2 bg-white text-slate-800 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
            title="Alternar Tela Cheia"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            {isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
          </button>
        </div>
        <div className="absolute top-4 right-4 flex gap-3">
          <button 
            onClick={() => setShowHowItWorksModal(true)}
            className="flex items-center gap-2 bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm text-sm font-semibold"
          >
            <Info size={16} />
            Como funciona
          </button>
          <a 
            href="https://wa.me/5531972323040"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm text-sm font-semibold"
          >
            <Phone size={16} />
            Fale conosco
          </a>
          <button 
            onClick={() => {
              setView('form');
              setSelectedClient(null);
              setFormData(initialFormData);
              setCategorizedFiles({});
            }}
            className="flex items-center gap-2 bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm text-sm font-semibold"
          >
            <UserPlus size={16} />
            Cadastro de Clientes
          </button>
          <button 
            onClick={() => setView('client_login')}
            className="flex items-center gap-2 bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm text-sm font-semibold"
          >
            <User size={16} />
            Já sou cliente
          </button>
          <button 
            onClick={() => setView('admin_login')}
            className="flex items-center gap-2 bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm text-sm font-semibold"
          >
            <LayoutDashboard size={16} />
            Acesso Admin
          </button>
        </div>
        <div className="max-w-[95%] mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-8">
          <div className="bg-white px-8 py-10 border-b-4 border-yellow-500 flex flex-col items-center text-center">
            <div className="mb-4 flex flex-col items-center justify-center">
              <div className="text-6xl font-black text-yellow-500 tracking-tighter leading-none flex items-center" style={{ fontFamily: 'Impact, sans-serif' }}>
                <span>G</span>
                <span className="-ml-1">M</span>
              </div>
              <div className="text-2xl font-light text-yellow-500 tracking-widest mt-1" style={{ fontFamily: 'Arial, sans-serif' }}>
                Empréstimos
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2 mt-4">Simulação de Empréstimo</h1>
            <p className="text-slate-500">
              {!selectedClient && !adminToken 
                ? "Acesso restrito para clientes cadastrados."
                : "Preencha os dados abaixo para solicitar sua simulação."}
            </p>
          </div>
          
          <div className="p-8 space-y-8">
            {!selectedClient && !adminToken ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 text-yellow-600 mb-6">
                  <UserPlus size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">Faça seu cadastro primeiro</h3>
                <p className="text-slate-600 max-w-md mx-auto mb-8 text-lg">
                  Para realizar uma simulação de empréstimo, é necessário ter um cadastro em nosso sistema. Se você já é cliente, faça login com seu CPF.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => {
                      setView('form');
                      setSelectedClient(null);
                      setFormData(initialFormData);
                      setCategorizedFiles({});
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 px-8 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-lg"
                  >
                    <UserPlus size={24} />
                    Fazer Cadastro
                  </button>
                  <button 
                    onClick={() => setView('client_login')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-4 px-8 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 border border-slate-300 text-lg"
                  >
                    <User size={24} />
                    Já sou cliente
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor Solicitado (R$)</label>
                <input 
                  type="number" 
                  value={simulacao.valorSolicitado} 
                  onChange={(e) => setSimulacao({...simulacao, valorSolicitado: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                  placeholder="Ex: 1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prazo das Parcelas</label>
                <select 
                  value={simulacao.prazo}
                  onChange={(e) => setSimulacao({...simulacao, prazo: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all bg-white"
                >
                  <option value="única">Parcela Única</option>
                  <option value="dia">Diário</option>
                  <option value="semanal">Semanal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal">Mensal</option>
                </select>
              </div>
              {simulacao.prazo !== 'única' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade de Parcelas</label>
                  <input 
                    type="number" 
                    min="1"
                    value={simulacao.quantidade} 
                    onChange={(e) => setSimulacao({...simulacao, quantidade: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data de Pagamento</label>
                  <input 
                    type="date" 
                    value={simulacao.dataVencimentoUnica} 
                    onChange={(e) => setSimulacao({...simulacao, dataVencimentoUnica: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                  />
                </div>
              )}
            </div>
            
            {adminToken ? (
              <button 
                onClick={calcularSimulacao}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-8 rounded-xl transition-all"
              >
                Calcular Simulação
              </button>
            ) : (
              <button 
                onClick={() => {
                  if (!simulacao.valorSolicitado || !simulacao.quantidade) {
                    alert('Por favor, preencha o valor e a quantidade de parcelas.');
                    return;
                  }
                  if (simulacao.prazo === 'única' && !simulacao.dataVencimentoUnica) {
                    alert('Por favor, informe a data de pagamento.');
                    return;
                  }
                  
                  const novaSimulacao = {
                    ...simulacao,
                    taxaJuros: '',
                    taxaAtrasoDia: '',
                    tipoTaxa: '',
                    parcelas: [],
                    status: 'pendente'
                  };

                  setSimulacao(novaSimulacao);
                  setPendingSimulation(novaSimulacao);
                  setShowSimulationConfirmModal(true);
                }}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 text-lg"
              >
                {selectedClient ? 'Solicitar Empréstimo' : 'Avançar para Cadastro'}
              </button>
            )}

            {simulacao.parcelas.length > 0 && adminToken && (
              <div className="mt-8 pt-8 border-t border-slate-200">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">Resultado da Simulação</h3>
                <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-slate-500">Valor Solicitado</p>
                      <p className="text-lg font-semibold text-slate-800">{formatCurrency(simulacao.valorSolicitado)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Total de Parcelas</p>
                      <p className="text-lg font-semibold text-slate-800">{simulacao.parcelas.length}x de {formatCurrency(simulacao.parcelas[0].valor)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-6">
                    <h4 className="font-medium text-slate-700 border-b border-yellow-200 pb-2">Cronograma de Pagamento:</h4>
                    <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                      {simulacao.parcelas.map((p, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-yellow-100 shadow-sm">
                          <span className="font-medium text-slate-700">Parcela {p.numero}</span>
                          <div className="text-right">
                            <div className="text-sm text-slate-500">Vencimento: {formatDate(p.dataVencimento)}</div>
                            <div className="font-semibold text-yellow-600">{formatCurrency(p.valor)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      if (adminToken) {
                        setView('admin');
                        setSelectedClient(null);
                      } else {
                        setView('client_dashboard');
                      }
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-4 px-8 rounded-xl transition-all text-lg"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => handleAddSimulation()}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 text-lg"
                  >
                    {simulacao.isRenegociacao ? 'Confirmar Renegociação' : 'Adicionar Empréstimo'}
                  </button>
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>
        {renderModals()}
        {undoState && (
          <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
            <div className="flex flex-col">
              <span className="font-medium">{undoState.message}</span>
              <span className="text-sm text-slate-400">Operação realizada com sucesso.</span>
            </div>
            <button
              onClick={handleUndo}
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-2 px-4 rounded-lg transition-colors whitespace-nowrap"
            >
              Desfazer
            </button>
            <button
              onClick={() => setUndoState(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans relative">
      <Toaster position="top-right" richColors />
      <div className="absolute top-4 left-4 flex gap-3">
        <button 
          onClick={toggleFullscreen}
          className="flex items-center gap-2 bg-white text-slate-800 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
          title="Alternar Tela Cheia"
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          {isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
        </button>
      </div>
      <div className="absolute top-4 right-4 flex gap-3">
        {!isEditingClientData && (
          <>
            <button 
              onClick={() => setView('welcome')}
              className="flex items-center gap-2 bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors shadow-sm text-sm font-semibold"
            >
              <ArrowLeft size={16} />
              Voltar à página inicial
            </button>
            <button 
              onClick={() => setShowHowItWorksModal(true)}
              className="flex items-center gap-2 bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm text-sm font-semibold"
            >
              <Info size={16} />
              Como funciona
            </button>
            <a 
              href="https://wa.me/5531972323040"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm text-sm font-semibold"
            >
              <Phone size={16} />
              Fale conosco
            </a>
            <button 
              onClick={() => setView('admin_login')}
              className="flex items-center gap-2 bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm text-sm font-semibold"
            >
              <LayoutDashboard size={16} />
              Acesso Admin
            </button>
          </>
        )}
      </div>
      <div className="max-w-[95%] mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-8">
        <div className="bg-white px-8 py-10 border-b-4 border-yellow-500 flex flex-col items-center text-center">
          <div className="mb-4 flex flex-col items-center justify-center">
            <div className="text-6xl font-black text-yellow-500 tracking-tighter leading-none flex items-center" style={{ fontFamily: 'Impact, sans-serif' }}>
              <span>G</span>
              <span className="-ml-1">M</span>
            </div>
            <div className="text-2xl font-light text-yellow-500 tracking-widest mt-1" style={{ fontFamily: 'Arial, sans-serif' }}>
              Empréstimos
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2 mt-4">Cadastro de Clientes</h1>
          <p className="text-slate-500">Preencha os dados abaixo para realizar o seu cadastro.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          
          {/* Dados Pessoais */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b pb-2">
              <User className="text-yellow-500" size={24} />
              <h2 className="text-xl font-semibold text-slate-800">Dados Pessoais</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
                <input type="text" name="nomeCompleto" value={formData.nomeCompleto} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da mãe</label>
                <input type="text" name="nomeMae" value={formData.nomeMae} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required={!isEditingClientData} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                <input type="text" name="cpf" value={formData.cpf} onChange={handleInputChange} className={`w-full px-4 py-2 border ${cpfError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-yellow-500 focus:border-yellow-500'} rounded-lg focus:ring-2 outline-none transition-all`} placeholder="000.000.000-00" required />
                {cpfError && <p className="text-red-500 text-xs mt-1">{cpfError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">RG</label>
                <input type="text" name="rg" value={formData.rg} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required={!isEditingClientData} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data de nascimento</label>
                <input type="text" name="dataNascimento" value={formData.dataNascimento} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" placeholder="DD/MM/AAAA" maxLength={10} required={!isEditingClientData} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                <input type="tel" name="telefone" value={formData.telefone} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
              </div>
            </div>
          </section>

          {/* Endereço */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b pb-2">
              <MapPin className="text-yellow-500" size={24} />
              <h2 className="text-xl font-semibold text-slate-800">Endereço</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
                <input type="text" name="cep" value={formData.cep} onChange={handleInputChange} onBlur={(e) => handleCepBlur(e, 'client')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" placeholder="00000-000" required />
                {loadingCep && <div className="absolute right-3 top-9 w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>}
                <button 
                  type="button" 
                  onClick={() => { setCepTarget('client'); setShowCepSearchModal(true); }}
                  className="text-xs text-yellow-600 hover:text-yellow-700 mt-1 underline"
                >
                  Não sei meu CEP
                </button>
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                <input type="text" name="endereco" value={formData.endereco} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                <input type="text" name="numero" value={formData.numero} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Complemento</label>
                <input type="text" name="complemento" value={formData.complemento} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                <input type="text" name="bairro" value={formData.bairro} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                <input type="text" name="cidade" value={formData.cidade} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                <input type="text" name="estado" value={formData.estado} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
              </div>
            </div>
          </section>

          {/* Parente Próximo */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b pb-2">
              <Users className="text-yellow-500" size={24} />
              <h2 className="text-xl font-semibold text-slate-800">Contato de Parente Próximo</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do parente próximo</label>
                <input type="text" name="parenteNome" value={formData.parenteNome} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required={!isEditingClientData} />
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Grau de parentesco</label>
                <input type="text" name="parenteGrau" value={formData.parenteGrau} onChange={handleInputChange} placeholder="Ex: Pai, Mãe, Irmão, Cônjuge" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required={!isEditingClientData} />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone do parente</label>
                <input type="tel" name="parenteTelefone" value={formData.parenteTelefone} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required={!isEditingClientData} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
              <div className="md:col-span-1 relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">CEP do parente</label>
                <input type="text" name="parenteCep" value={formData.parenteCep} onChange={handleInputChange} onBlur={(e) => handleCepBlur(e, 'parente')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" placeholder="00000-000" required={!isEditingClientData} />
                {loadingParenteCep && <div className="absolute right-3 top-9 w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>}
                <button 
                  type="button" 
                  onClick={() => { setCepTarget('parente'); setShowCepSearchModal(true); }}
                  className="text-xs text-yellow-600 hover:text-yellow-700 mt-1 underline"
                >
                  Não sei o CEP
                </button>
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço do parente</label>
                <input type="text" name="parenteEndereco" value={formData.parenteEndereco} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required={!isEditingClientData} />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                <input type="text" name="parenteNumero" value={formData.parenteNumero} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required={!isEditingClientData} />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Complemento</label>
                <input type="text" name="parenteComplemento" value={formData.parenteComplemento} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                <input type="text" name="parenteBairro" value={formData.parenteBairro} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required={!isEditingClientData} />
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                <input type="text" name="parenteCidade" value={formData.parenteCidade} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required={!isEditingClientData} />
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                <input type="text" name="parenteEstado" value={formData.parenteEstado} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required={!isEditingClientData} />
              </div>
            </div>
          </section>

          {/* Informações Adicionais */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b pb-2">
              <FileText className="text-yellow-500" size={24} />
              <h2 className="text-xl font-semibold text-slate-800">Informações Adicionais</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Qual a sua atividade financeira?</label>
                <input type="text" name="atividadeFinanceira" value={formData.atividadeFinanceira} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required={!isEditingClientData} />
              </div>

              <div className="md:col-span-2 mt-2 mb-4">
                <h3 className="text-md font-medium text-slate-700 mb-4 border-b pb-2">Endereço da Atividade Financeira</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-1 relative">
                    <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
                    <input type="text" name="atividadeFinanceiraCep" value={formData.atividadeFinanceiraCep} onChange={handleInputChange} onBlur={(e) => handleCepBlur(e, 'atividadeFinanceira')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" placeholder="00000-000" />
                    {loadingAtividadeCep && <div className="absolute right-3 top-9 w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>}
                    <button 
                      type="button" 
                      onClick={() => { setCepTarget('atividadeFinanceira'); setShowCepSearchModal(true); }}
                      className="text-xs text-yellow-600 hover:text-yellow-700 mt-1 underline"
                    >
                      Não sei o CEP
                    </button>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                    <input type="text" name="atividadeFinanceiraEndereco" value={formData.atividadeFinanceiraEndereco} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                    <input type="text" name="atividadeFinanceiraNumero" value={formData.atividadeFinanceiraNumero} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Complemento</label>
                    <input type="text" name="atividadeFinanceiraComplemento" value={formData.atividadeFinanceiraComplemento} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                    <input type="text" name="atividadeFinanceiraBairro" value={formData.atividadeFinanceiraBairro} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" />
                  </div>
                  
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                    <input type="text" name="atividadeFinanceiraCidade" value={formData.atividadeFinanceiraCidade} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" />
                  </div>
                  
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                    <input type="text" name="atividadeFinanceiraEstado" value={formData.atividadeFinanceiraEstado} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quem te indicou?</label>
                <input type="text" name="quemIndicou" value={formData.quemIndicou} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Redes sociais (Instagram, Facebook, etc)</label>
                <input type="text" name="redesSociais" value={formData.redesSociais} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" placeholder="@seuperfil" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Observações Gerais</label>
                <textarea 
                  name="observacoes" 
                  value={formData.observacoes} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all min-h-[120px]" 
                  placeholder="Informações relevantes sobre o cliente, referências, bens oferecidos como garantia, etc."
                />
              </div>

              {adminToken && (
                <div className="md:col-span-2 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <label className="block text-sm font-bold text-yellow-800 mb-1 flex items-center gap-2">
                    <FileText size={16} />
                    Anotações Internas (Visão Admin)
                  </label>
                  <p className="text-xs text-yellow-700 mb-2">Estas anotações são visíveis apenas para administradores.</p>
                  <textarea 
                    name="observacoesAdmin" 
                    value={formData.observacoesAdmin || ''} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all min-h-[120px] bg-white" 
                    placeholder="Anotações internas, histórico de cobranças, detalhes confidenciais, etc."
                  />
                </div>
              )}

              {isEditingClientData && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status do Cliente (Sinalização)</label>
                  <select
                    name="statusManual"
                    value={formData.statusManual || 'automatico'}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
                  >
                    <option value="automatico">Automático (Baseado nas parcelas)</option>
                    <option value="em_dia">Em Dia (Verde)</option>
                    <option value="vence_hoje">Vence Hoje (Amarelo)</option>
                    <option value="atrasado">Atrasado (Vermelho)</option>
                    <option value="muito_atrasado">Atrasado +30 Dias (Vermelho Escuro)</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Selecione "Automático" para que o sistema defina a cor com base no vencimento das parcelas.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Documentos */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b pb-2">
              <Camera className="text-yellow-500" size={24} />
              <h2 className="text-xl font-semibold text-slate-800">Anexo de Documentos</h2>
            </div>
            
            {isEditingClientData && formData.arquivos && formData.arquivos.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Arquivos Anexados Anteriormente</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formData.arquivos.map((file: any, index: number) => (
                    <div key={index} className="border border-slate-200 rounded-xl p-4 flex flex-col items-center relative group">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (window.confirm('Tem certeza que deseja remover este anexo?')) {
                            const newArquivos = [...formData.arquivos];
                            newArquivos.splice(index, 1);
                            setFormData({ ...formData, arquivos: newArquivos });
                          }
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                        title="Remover anexo"
                      >
                        <Trash2 size={16} />
                      </button>
                      {file.type.startsWith('image/') ? (
                        <img src={file.url} alt={file.name} className="max-w-full h-auto max-h-32 object-contain rounded-lg mb-3" />
                      ) : (
                        <div className="w-full h-32 bg-slate-100 flex items-center justify-center rounded-lg mb-3">
                          <FileText size={48} className="text-slate-400" />
                        </div>
                      )}
                      {file.categoria && (
                        <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full mb-2">
                          {file.categoria}
                        </span>
                      )}
                      <p className="text-sm text-slate-600 text-center truncate w-full" title={file.name}>{file.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documentCategories.map((category) => (
                <div key={category.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center relative hover:bg-slate-100 transition-colors">
                  <div className="mb-2">
                    <span className="font-medium text-slate-800">{category.label}</span>
                    {category.required && <span className="text-red-500 ml-1" title="Obrigatório">*</span>}
                  </div>
                  
                  <div className="w-full relative mt-2">
                    <input 
                      type="file" 
                      onChange={(e) => handleCategorizedFileChange(category.id, e)} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      accept="image/*,.pdf"
                    />
                    <div className={`w-full py-6 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors ${categorizedFiles[category.id] ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-white group-hover:border-yellow-400'}`}>
                      {categorizedFiles[category.id] ? (
                        <>
                          <CheckCircle2 className="text-emerald-500 mb-2" size={24} />
                          <span className="text-sm text-emerald-700 font-medium truncate w-full px-2" title={categorizedFiles[category.id].name}>
                            {categorizedFiles[category.id].name}
                          </span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="text-slate-400 mb-2" size={24} />
                          <span className="text-sm text-slate-500">Clique para anexar</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="pt-6 border-t flex gap-4">
            {isEditingClientData && (
              <button 
                type="button"
                onClick={() => {
                  setIsEditingClientData(false);
                  setView('admin');
                }}
                className="w-1/3 font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 text-lg bg-slate-200 hover:bg-slate-300 text-slate-700"
              >
                Cancelar
              </button>
            )}
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`${isEditingClientData ? 'w-2/3' : 'w-full'} font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 text-lg ${isSubmitting ? 'bg-slate-400 cursor-not-allowed text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </>
              ) : (
                isEditingClientData ? 'Salvar Alterações' : 'Concluir Cadastro'
              )}
            </button>
          </div>
        </form>
      </div>
      {renderModals()}
      {undoState && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex flex-col">
            <span className="font-medium">{undoState.message}</span>
            <span className="text-sm text-slate-400">Operação realizada com sucesso.</span>
          </div>
          <button
            onClick={handleUndo}
            className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-2 px-4 rounded-lg transition-colors whitespace-nowrap"
          >
            Desfazer
          </button>
          <button
            onClick={() => setUndoState(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
