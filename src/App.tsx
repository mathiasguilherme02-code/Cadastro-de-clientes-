import React, { useState, useEffect } from 'react';
import { User, MapPin, FileText, Users, Camera, UploadCloud, CheckCircle2, LayoutDashboard, ArrowLeft, ArrowRight, Eye, ImageIcon, Download, Maximize, Minimize, Phone, Info, X, UserPlus, Calculator, Edit2, Save, Trash2, Calendar, TrendingUp, Plus, AlertCircle, LogOut } from 'lucide-react';

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
  observacoes: '',
  documentos: null as FileList | null
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

export default function App() {
  const [view, setView] = useState<'welcome' | 'simulation' | 'form' | 'admin_login' | 'admin' | 'client_login' | 'client_dashboard'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cliente') === 'true') return 'client_login';
    if (params.get('admin') === 'true') return 'admin_login';
    return 'welcome';
  });
  const [adminTab, setAdminTab] = useState<'clientes' | 'cronograma' | 'fluxo_caixa'>('clientes');
  const [cronogramaDate, setCronogramaDate] = useState(getLocalISODate());
  const [fluxoMonth, setFluxoMonth] = useState(getLocalISOMonth()); // YYYY-MM
  const [newRetirada, setNewRetirada] = useState({ valor: '', descricao: '', data: getLocalISODate(), tipo: 'retirada' });
  
  const [adminPassword, setAdminPassword] = useState('');
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken') || '');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem('adminToken', adminToken);
    } else {
      localStorage.removeItem('adminToken');
    }
  }, [adminToken]);
  const [clientCpf, setClientCpf] = useState('');
  const [clientLoginError, setClientLoginError] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientToDelete, setClientToDelete] = useState<any | null>(null);
  const [editingParcela, setEditingParcela] = useState<{simIndex: number, parcelaIndex: number} | null>(null);
  const [editParcelaData, setEditParcelaData] = useState({dataVencimento: '', valor: 0});
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [editTransactionData, setEditTransactionData] = useState({ valor: '', descricao: '', data: '', tipo: '' });

  const [adminSettings, setAdminSettings] = useState({
    taxaJuros: '40',
    taxaAtrasoDia: '8'
  });

  const [simulacao, setSimulacao] = useState({
    valorSolicitado: '',
    prazo: 'mensal',
    quantidade: '1',
    taxaJuros: '15',
    taxaAtrasoDia: '1',
    parcelas: [] as any[]
  });
  const [editingSimIndex, setEditingSimIndex] = useState<number | null>(null);
  const [editSimData, setEditSimData] = useState({
    valorSolicitado: '',
    prazo: 'mensal',
    quantidade: '1',
    taxaJuros: '15',
    taxaAtrasoDia: '1'
  });

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
        }
      } catch (e) {
        console.error("Error parsing SSE message:", e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const [formData, setFormData] = useState(initialFormData);

  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingParenteCep, setLoadingParenteCep] = useState(false);
  const [cpfError, setCpfError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCepSearchModal, setShowCepSearchModal] = useState(false);
  const [cepSearchData, setCepSearchData] = useState({ uf: '', cidade: '', logradouro: '' });
  const [cepSearchResults, setCepSearchResults] = useState<any[]>([]);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepSearchError, setCepSearchError] = useState('');
  const [cepTarget, setCepTarget] = useState<'client' | 'parente'>('client');

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
    } else {
      setFormData(prev => ({
        ...prev,
        parenteCep: address.cep,
        parenteEndereco: address.logradouro,
        parenteBairro: address.bairro,
        parenteCidade: address.localidade,
        parenteEstado: address.uf
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
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  const calcularSimulacao = () => {
    const valor = parseFloat(simulacao.valorSolicitado);
    if (!valor || isNaN(valor)) return;

    const qtd = simulacao.prazo === 'única' ? 1 : parseInt(simulacao.quantidade) || 1;
    const taxa = parseFloat(adminSettings.taxaJuros) || 15;
    
    const valorTotal = valor + (valor * (taxa / 100));
    const valorParcela = valorTotal / qtd;

    const novasParcelas = [];
    let dataAtual = new Date();

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
        dataVencimento.setMonth(dataVencimento.getMonth() + 1);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (e.target.files.length > 10) {
        alert("Você pode anexar no máximo 10 arquivos.");
        const dt = new DataTransfer();
        for (let i = 0; i < 10; i++) {
          dt.items.add(e.target.files[i]);
        }
        setFormData(prev => ({ ...prev, documentos: dt.files }));
      } else {
        setFormData(prev => ({ ...prev, documentos: e.target.files }));
      }
    }
  };

  const fetchAddress = async (cep: string, isParente: boolean) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    if (isParente) setLoadingParenteCep(true);
    else setLoadingCep(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        if (isParente) {
          setFormData(prev => ({
            ...prev,
            parenteEndereco: data.logradouro || '',
            parenteBairro: data.bairro || '',
            parenteCidade: data.localidade || '',
            parenteEstado: data.uf || ''
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
      if (isParente) setLoadingParenteCep(false);
      else setLoadingCep(false);
    }
  };

  const handleCepBlur = (e: React.FocusEvent<HTMLInputElement>, isParente: boolean) => {
    fetchAddress(e.target.value, isParente);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.cpf && !validateCPF(formData.cpf)) {
      setCpfError('Por favor, insira um CPF válido antes de continuar.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Convert files to base64 for database storage
      const fileUrls: { name: string, url: string, type: string }[] = [];
    if (formData.documentos) {
      let totalSize = 0;
      for (let i = 0; i < formData.documentos.length; i++) {
        totalSize += formData.documentos[i].size;
      }
      if (totalSize > 4 * 1024 * 1024) {
        alert("O tamanho total dos arquivos excede o limite de 4MB. Por favor, envie arquivos menores ou em menor quantidade.");
        return;
      }

      for (let i = 0; i < formData.documentos.length; i++) {
        const file = formData.documentos[i];
        
        // Limit file size to 2MB
        if (file.size > 2 * 1024 * 1024) {
          alert(`O arquivo ${file.name} é muito grande. O tamanho máximo é 2MB.`);
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
          url: base64
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

    const newClient = {
      ...formData,
      id: generateUUID(),
      dataCadastro: getLocalISODateTime(),
      arquivos: fileUrls,
      simulacoes: simulacao.valorSolicitado ? [{ ...simulacao, status: 'pendente', dataCriacao: getLocalISODateTime() }] : []
    };

    try {
      const payloadString = JSON.stringify(newClient);
      const payload = payloadString;
      
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      
      setClients(prev => [newClient, ...prev]);
      setShowSuccessModal(true);
      
      // Reset form
      setFormData(initialFormData);
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

  const handleAddSimulation = async () => {
    if (!selectedClient) return;
    
    const clientSimulacoes = selectedClient.simulacoes || (selectedClient.simulacao ? [selectedClient.simulacao] : []);
    const novaSimulacao = { ...simulacao, status: 'pendente', dataCriacao: getLocalISODateTime() };
    const updatedSimulacoes = [novaSimulacao, ...clientSimulacoes];
    
    const updatedClient = {
      ...selectedClient,
      simulacoes: updatedSimulacoes
    };
    
    try {
      const payloadString = JSON.stringify(updatedClient);
      const payload = payloadString;
      
      const response = await fetch(`/api/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: payload
      });
      
      if (!response.ok) {
        alert('Erro ao adicionar empréstimo.');
        return;
      }
      
      // Update local state
      setClients(prev => prev.map(c => c.id === selectedClient.id ? updatedClient : c));
      setSelectedClient(updatedClient);
      setView('client_dashboard');
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
      } else {
        setClientLoginError('CPF não encontrado em nossa base de dados.');
      }
    } catch (error) {
      setClientLoginError('Erro ao conectar com o servidor.');
    }
  };

  const renderModals = () => (
    <>
      {/* Modals */}
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
    const clientSimulacoes = rawSimulacoes.filter((s: any) => s && s.valorSolicitado);
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
              <h1 className="text-3xl font-bold text-slate-800">Olá, {selectedClient.nomeCompleto.split(' ')[0]}!</h1>
              <p className="text-slate-500">Acompanhe o histórico e situação dos seus empréstimos</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setSimulacao({
                    valorSolicitado: '',
                    prazo: 'mensal',
                    quantidade: '1',
                    parcelas: [],
                    taxaJuros: adminSettings.taxaJuros,
                    taxaAtrasoDia: adminSettings.taxaAtrasoDia
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
              clientSimulacoes.map((sim: any, simIndex: number) => (
              <div key={simIndex} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-yellow-500 px-8 py-6 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      Empréstimo {clientSimulacoes.length > 1 ? `#${clientSimulacoes.length - simIndex}` : ''}
                      {sim.status === 'pendente' && <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full uppercase tracking-wider">Em Análise</span>}
                      {sim.status === 'reprovado' && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full uppercase tracking-wider">Reprovado</span>}
                      {(sim.status === 'aprovado' || !sim.status) && <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full uppercase tracking-wider">Aprovado</span>}
                    </h2>
                    <p className="text-yellow-100 mt-1">Valor Solicitado: {formatCurrency(sim.valorSolicitado)}</p>
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
                        Sua solicitação de empréstimo está sendo analisada pela nossa equipe. 
                        Você será notificado assim que houver uma atualização.
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
                      
                      if (isVencida) {
                        const diffTime = Math.abs(hoje.getTime() - vencimento.getTime());
                        diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const taxaDia = parseFloat(sim.taxaAtrasoDia) || 1;
                        valorAtualizado = p.valor + (p.valor * (taxaDia / 100) * diasAtraso);
                      }

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
                  </>
                  )}
                </div>
              </div>
            )))}
          </div>
        </div>
      </div>
    );
  }

  const handleDeleteClient = async (id: string) => {
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
                onClick={() => { setView('form'); setAdminPassword(''); setLoginError(''); }}
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
        .filter((s: any) => s.status !== 'pendente' && s.status !== 'reprovado')
        .flatMap((s: any, sIdx: number) => 
        (s.parcelas || []).map((p: any, pIdx: number) => ({
          ...p,
          clientId: c.id,
          clientName: c.nomeCompleto,
          clientPhone: c.telefone,
          simIndex: sIdx,
          parcelaIndex: pIdx,
          taxaAtrasoDia: s.taxaAtrasoDia
        }))
      )
    ).filter(p => p.dataVencimento === cronogramaDate);

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
    const sortedAllTransactions = [...unifiedTransactions].sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime());
    let runningBalance = 0;
    const transactionsWithBalance = sortedAllTransactions.map(t => {
      if (['entrada', 'aporte'].includes(t.tipo)) {
        runningBalance += t.valor;
      } else {
        runningBalance -= t.valor;
      }
      return { ...t, saldoApos: runningBalance };
    });

    const monthEntradas = clients.flatMap(c => 
      (c.simulacoes || (c.simulacao ? [c.simulacao] : []))
        .filter((s: any) => s.status !== 'pendente' && s.status !== 'reprovado')
        .flatMap((s: any) => 
        (s.parcelas || []).filter((p: any) => p.paga && (p.dataPagamento || p.dataVencimento)?.startsWith(fluxoMonth))
      )
    ).reduce((acc, p) => acc + parseFloat(p.valor || 0), 0);

    const monthInadimplencia = clients.flatMap(c => 
      (c.simulacoes || (c.simulacao ? [c.simulacao] : []))
        .filter((s: any) => s.status !== 'pendente' && s.status !== 'reprovado')
        .flatMap((s: any) => 
        (s.parcelas || []).filter((p: any) => {
          const hoje = new Date();
          hoje.setHours(0,0,0,0);
          const vencimento = parseLocalDate(p.dataVencimento);
          vencimento.setHours(0,0,0,0);
          return !p.paga && vencimento < hoje && p.dataVencimento.startsWith(fluxoMonth);
        })
      )
    ).reduce((acc, p) => acc + parseFloat(p.valor || 0), 0);

    const monthSaidas = clients.flatMap(c => 
      (c.simulacoes || (c.simulacao ? [c.simulacao] : [])).filter((s: any) => {
        // If sim has dataCriacao, use it. Otherwise use client's dataCadastro
        const date = s.dataCriacao || c.dataCadastro;
        return date && date.startsWith(fluxoMonth) && s.status !== 'pendente' && s.status !== 'reprovado';
      })
    ).reduce((acc, s) => acc + parseFloat(s.valorSolicitado || 0), 0);

    const monthRetiradas = adminTransactions
      .filter((t: any) => t.data.startsWith(fluxoMonth) && t.tipo !== 'aporte')
      .reduce((acc: number, t: any) => acc + parseFloat(t.valor || 0), 0);

    const monthAportes = adminTransactions
      .filter((t: any) => t.data.startsWith(fluxoMonth) && t.tipo === 'aporte')
      .reduce((acc: number, t: any) => acc + parseFloat(t.valor || 0), 0);

    const saldo = monthEntradas + monthAportes - monthSaidas - monthRetiradas;

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
      taxaAtrasoDia: sim.taxaAtrasoDia || adminSettings.taxaAtrasoDia
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
    const taxa = parseFloat(editSimData.taxaJuros) || 15;
    
    const valorTotal = valor + (valor * (taxa / 100));
    const valorParcela = valorTotal / qtd;

    const novasParcelas = [];
    let dataAtual = new Date();

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
        dataVencimento.setMonth(dataVencimento.getMonth() + 1);
      }

      novasParcelas.push({
        numero: i,
        dataVencimento: getLocalISODate(dataVencimento),
        valor: valorParcela,
        status: 'pendente'
      });
    }

    const updatedSimulacoes = [...selectedClient.simulacoes];
    updatedSimulacoes[simIndex] = {
      ...updatedSimulacoes[simIndex],
      ...editSimData,
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
      const response = await fetch(`/api/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(updatedClient)
      });
      
      if (!response.ok) {
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
        const response = await fetch(`/api/clients/${selectedClient.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify(updatedClient)
        });
        
        if (!response.ok) {
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
        <div className="max-w-[98%] mx-auto">
          <div className="flex justify-between items-center mb-8">
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

          {clients.filter(c => (c.simulacoes || (c.simulacao ? [c.simulacao] : [])).some((s: any) => s.status === 'pendente')).length > 0 && (
            <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
              <AlertCircle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-yellow-800 font-bold">Atenção: Empréstimos Pendentes</h3>
                <p className="text-yellow-700 mt-1">
                  Existem <strong>{clients.filter(c => (c.simulacoes || (c.simulacao ? [c.simulacao] : [])).some((s: any) => s.status === 'pendente')).length}</strong> cliente(s) com solicitações de empréstimo aguardando aprovação.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4 mb-8 border-b border-slate-200">
            <button
              onClick={() => { setAdminTab('clientes'); setSelectedClient(null); }}
              className={`pb-3 px-4 text-sm font-medium transition-colors ${adminTab === 'clientes' ? 'border-b-2 border-yellow-500 text-yellow-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Clientes
            </button>
            <button
              onClick={() => { setAdminTab('cronograma'); setSelectedClient(null); }}
              className={`pb-3 px-4 text-sm font-medium transition-colors ${adminTab === 'cronograma' ? 'border-b-2 border-yellow-500 text-yellow-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Cronograma Diário
            </button>
            <button
              onClick={() => { setAdminTab('fluxo_caixa'); setSelectedClient(null); }}
              className={`pb-3 px-4 text-sm font-medium transition-colors ${adminTab === 'fluxo_caixa' ? 'border-b-2 border-yellow-500 text-yellow-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Fluxo de Caixa
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Taxa de Juros Padrão (%)</label>
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

          {selectedClient ? (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden" id="pdf-content">
              <div className="bg-slate-800 px-8 py-6 text-white flex justify-between items-center print:bg-slate-800 print:text-white">
                <div>
                  <h2 className="text-2xl font-bold">{selectedClient.nomeCompleto}</h2>
                  <p className="text-slate-300">CPF: {selectedClient.cpf} | Cadastrado em: {selectedClient.dataCadastro}</p>
                </div>
                <div className="flex gap-3 print:hidden">
                  <button 
                    onClick={() => {
                      setSimulacao({
                        valorSolicitado: '',
                        prazo: 'mensal',
                        quantidade: '1',
                        parcelas: [],
                        taxaJuros: adminSettings.taxaJuros,
                        taxaAtrasoDia: adminSettings.taxaAtrasoDia
                      });
                      setView('simulation');
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Calculator size={18} />
                    Nova Simulação
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
                <div>
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
                    <p><span className="font-medium text-slate-500">Telefone:</span> {selectedClient.parenteTelefone}</p>
                    <p><span className="font-medium text-slate-500">Endereço:</span> {selectedClient.parenteEndereco}, {selectedClient.parenteNumero}</p>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 mt-8 border-b pb-2">Outras Informações</h3>
                  <div className="space-y-3 text-sm">
                    <p><span className="font-medium text-slate-500">Atividade Financeira:</span> {selectedClient.atividadeFinanceira || 'Não informado'}</p>
                    <p><span className="font-medium text-slate-500">Indicação:</span> {selectedClient.quemIndicou || 'Não informado'}</p>
                    <p><span className="font-medium text-slate-500">Redes Sociais:</span> {selectedClient.redesSociais || 'Não informado'}</p>
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="font-medium text-slate-500 mb-1">Observações Gerais:</p>
                      <p className="text-slate-700 whitespace-pre-wrap">{selectedClient.observacoes || 'Nenhuma observação registrada.'}</p>
                    </div>
                  </div>
                </div>

                <div>
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
                    {selectedClient.simulacoes.map((sim: any, simIndex: number) => (
                      <div key={simIndex} id={`simulacao-detalhes-${simIndex}`} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
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
                              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">Aprovado</span>
                            )}
                            {sim.status === 'reprovado' && (
                              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">Reprovado</span>
                            )}
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
                              {editSimData.prazo !== 'única' && (
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
                              )}
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Taxa de Juros (%)</label>
                                <input
                                  type="number"
                                  value={editSimData.taxaJuros}
                                  onChange={(e) => setEditSimData({...editSimData, taxaJuros: e.target.value})}
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
                                <p className="text-sm text-slate-500">Prazo</p>
                                <p className="text-lg font-semibold text-slate-800 capitalize">{sim.prazo}</p>
                              </div>
                              <div className="col-span-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                <p className="text-xs text-yellow-800 font-medium mb-1">Cálculo de Juros (Visão Admin)</p>
                                <p className="text-sm text-yellow-900">Taxa aplicada: {sim.taxaJuros}%</p>
                                <p className="text-xs text-yellow-700 mt-1">Fórmula: Valor Solicitado + Taxa de Juros / pelas parcelas</p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-semibold text-slate-700">Controle de Parcelas</h4>
                                <div className="flex gap-2 print:hidden">
                                    <button 
                                      onClick={() => window.print()}
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
                            
                            if (isVencida) {
                              const diffTime = Math.abs(hoje.getTime() - vencimento.getTime());
                              diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              const taxaDia = parseFloat(sim.taxaAtrasoDia) || 1;
                              valorAtualizado = p.valor + (p.valor * (taxaDia / 100) * diasAtraso);
                            }

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
                                          setEditParcelaData({ dataVencimento: p.dataVencimento, valor: p.valor });
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
                                                valor: editParcelaData.valor 
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
                                      href={`https://wa.me/55${selectedClient.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${selectedClient.nomeCompleto.split(' ')[0]}, a GM-Empréstimo (31 97232-3040) informa que sua Parcela ${p.numero} está VENCIDA (${formatDate(p.dataVencimento)}). O valor atualizado com juros de atraso (${diasAtraso} dias) é de ${formatCurrency(valorAtualizado)}. Por favor, regularize o quanto antes para evitar maiores encargos.`)}`}
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
                                      href={`https://wa.me/55${selectedClient.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${selectedClient.nomeCompleto.split(' ')[0]}, a GM-Empréstimo (31 97232-3040) informa que sua Parcela ${p.numero} no valor de ${formatCurrency(p.valor)} vence hoje (${formatDate(p.dataVencimento)}). O pagamento deve ser realizado até as 18 horas via Pix, ou via motoboy até 17 horas.`)}`}
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
                        </>
                        )}
                      </div>
                    ))}
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
              {clients.filter(c => c.id !== 'admin-transactions').length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="py-4 px-6 font-semibold text-slate-700">Nome do Cliente</th>
                        <th className="py-4 px-6 font-semibold text-slate-700">CPF</th>
                        <th className="py-4 px-6 font-semibold text-slate-700">Telefone</th>
                        <th className="py-4 px-6 font-semibold text-slate-700">Data de Cadastro</th>
                        <th className="py-4 px-6 font-semibold text-slate-700">Documentos</th>
                        <th className="py-4 px-6 font-semibold text-slate-700 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.filter(c => c.id !== 'admin-transactions').sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto)).map(client => (
                        <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
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
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <Users size={64} className="text-slate-300 mb-4" />
                  <h3 className="text-xl font-medium text-slate-700 mb-2">Nenhum cliente cadastrado</h3>
                  <p className="text-slate-500">Os clientes que preencherem o formulário aparecerão aqui.</p>
                </div>
              )}
            </div>
          ) : null}

          {!selectedClient && adminTab === 'cronograma' && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Calendar size={24} className="text-yellow-500" />
                  Cronograma Diário
                </h2>
                <input 
                  type="date" 
                  value={cronogramaDate}
                  onChange={(e) => setCronogramaDate(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                />
              </div>

              {cronogramaParcelas.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="py-4 px-6 font-semibold text-slate-700">Cliente</th>
                        <th className="py-4 px-6 font-semibold text-slate-700">Telefone</th>
                        <th className="py-4 px-6 font-semibold text-slate-700">Parcela</th>
                        <th className="py-4 px-6 font-semibold text-slate-700">Valor</th>
                        <th className="py-4 px-6 font-semibold text-slate-700">Status</th>
                        <th className="py-4 px-6 font-semibold text-slate-700 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cronogramaParcelas.map((p, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6 font-medium text-slate-800">{p.clientName}</td>
                          <td className="py-4 px-6 text-slate-600">{p.clientPhone}</td>
                          <td className="py-4 px-6 text-slate-600">{p.numero}</td>
                          <td className="py-4 px-6 text-slate-600">{formatCurrency(p.valor)}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              p.status === 'pago' ? 'bg-green-100 text-green-800' :
                              p.status === 'atrasado' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {p.status === 'pago' ? 'Pago' : p.status === 'atrasado' ? 'Atrasado' : 'Pendente'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!p.paga && (
                                <a 
                                  href={`https://wa.me/55${p.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                    (() => {
                                      const hoje = new Date();
                                      hoje.setHours(0,0,0,0);
                                      const vencimento = parseLocalDate(p.dataVencimento);
                                      vencimento.setHours(0,0,0,0);
                                      const isVencida = !p.paga && vencimento < hoje;
                                      const isVencendoHoje = !p.paga && vencimento.getTime() === hoje.getTime();
                                      
                                      if (isVencendoHoje) {
                                        return `Olá ${p.clientName.split(' ')[0]}, a GM-Empréstimo (31 97232-3040) informa que sua Parcela ${p.numero} no valor de ${formatCurrency(p.valor)} vence hoje (${formatDate(p.dataVencimento)}). O pagamento deve ser realizado até as 18 horas via Pix, ou via motoboy até 17 horas.`;
                                      } else if (isVencida) {
                                        const diffTime = Math.abs(hoje.getTime() - vencimento.getTime());
                                        const diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                        const taxaDia = parseFloat(p.taxaAtrasoDia) || parseFloat(adminSettings.taxaAtrasoDia) || 1;
                                        const valorAtualizado = p.valor + (p.valor * (taxaDia / 100) * diasAtraso);
                                        return `Olá ${p.clientName.split(' ')[0]}, a GM-Empréstimo (31 97232-3040) informa que sua Parcela ${p.numero} está VENCIDA (${formatDate(p.dataVencimento)}). O valor atualizado com juros de atraso (${diasAtraso} dias) é de ${formatCurrency(valorAtualizado)}. Por favor, regularize o quanto antes para evitar maiores encargos.`;
                                      }
                                      return '';
                                    })()
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 transition-colors"
                                  title="Notificar via WhatsApp"
                                >
                                  <Phone size={18} />
                                </a>
                              )}
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
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <Calendar size={64} className="text-slate-300 mb-4" />
                  <h3 className="text-xl font-medium text-slate-700 mb-2">Nenhuma parcela para esta data</h3>
                  <p className="text-slate-500">Não há vencimentos programados para o dia selecionado.</p>
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
                  <input 
                    type="month" 
                    value={fluxoMonth}
                    onChange={(e) => setFluxoMonth(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
                  <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                    <p className="text-sm font-medium text-green-600 mb-1">Entradas (Pagamentos)</p>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(monthEntradas)}</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                    <p className="text-sm font-medium text-emerald-600 mb-1">Aportes (Capital)</p>
                    <p className="text-2xl font-bold text-emerald-700">{formatCurrency(monthAportes)}</p>
                  </div>
                  <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                    <p className="text-sm font-medium text-red-600 mb-1">Saídas (Empréstimos)</p>
                    <p className="text-2xl font-bold text-red-700">{formatCurrency(monthSaidas)}</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
                    <p className="text-sm font-medium text-orange-600 mb-1">Retiradas / Despesas</p>
                    <p className="text-2xl font-bold text-orange-700">{formatCurrency(monthRetiradas)}</p>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl">
                    <p className="text-sm font-medium text-rose-600 mb-1">Inadimplência (Mês)</p>
                    <p className="text-2xl font-bold text-rose-700">{formatCurrency(monthInadimplencia)}</p>
                  </div>
                  <div className={`border p-4 rounded-xl ${saldo >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'}`}>
                    <p className={`text-sm font-medium mb-1 ${saldo >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>Saldo do Mês</p>
                    <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>{formatCurrency(saldo)}</p>
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
                <h3 className="text-lg font-bold text-slate-800 mb-4">Histórico de Movimentações ({fluxoMonth})</h3>
                {transactionsWithBalance.filter((t: any) => t.data.startsWith(fluxoMonth)).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="py-3 px-4 font-semibold text-slate-700">Data</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Tipo</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Descrição Detalhada</th>
                          <th className="py-3 px-4 font-semibold text-slate-700 text-right">Valor</th>
                          <th className="py-3 px-4 font-semibold text-slate-700 text-right">Saldo</th>
                          <th className="py-3 px-4 font-semibold text-slate-700 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...transactionsWithBalance]
                          .filter((t: any) => t.data.startsWith(fluxoMonth))
                          .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
                          .map((t: any, idx: number) => (
                          <tr key={t.id || idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{t.data.split('-').reverse().join('/')}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${
                                t.tipo === 'aporte' ? 'bg-emerald-100 text-emerald-700' : 
                                t.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 
                                t.tipo === 'saida' ? 'bg-red-100 text-red-700' : 
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {t.tipo === 'aporte' ? 'Aporte' : 
                                 t.tipo === 'entrada' ? 'Entrada' : 
                                 t.tipo === 'saida' ? 'Saída' : 
                                 'Retirada'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-slate-800 font-semibold">{t.descricao}</div>
                              <div className="text-xs text-slate-500">{t.detalhes}</div>
                            </td>
                            <td className={`py-3 px-4 text-right font-bold ${['aporte', 'entrada'].includes(t.tipo) ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {['aporte', 'entrada'].includes(t.tipo) ? '+' : '-'} {formatCurrency(t.valor)}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-slate-600 bg-slate-50/50">
                              {formatCurrency(t.saldoApos)}
                            </td>
                            <td className="py-3 px-4">
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">Nenhuma movimentação registrada neste mês.</p>
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
            <p className="text-slate-500">Faça uma simulação antes de realizar o seu cadastro.</p>
          </div>
          
          <div className="p-8 space-y-8">
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
              {simulacao.prazo !== 'única' && (
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
              )}
            </div>
            
            <button 
              onClick={calcularSimulacao}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-8 rounded-xl transition-all"
            >
              Calcular Simulação
            </button>

            {simulacao.parcelas.length > 0 && (
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
                
                {selectedClient ? (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setView('client_dashboard')}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-4 px-8 rounded-xl transition-all text-lg"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleAddSimulation}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 text-lg"
                    >
                      Adicionar Empréstimo
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setView('form')}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 text-lg"
                  >
                    Avançar para Cadastro
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {renderModals()}
      </div>
    );
  }

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
                <input type="text" name="nomeMae" value={formData.nomeMae} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                <input type="text" name="cpf" value={formData.cpf} onChange={handleInputChange} className={`w-full px-4 py-2 border ${cpfError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-yellow-500 focus:border-yellow-500'} rounded-lg focus:ring-2 outline-none transition-all`} placeholder="000.000.000-00" required />
                {cpfError && <p className="text-red-500 text-xs mt-1">{cpfError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">RG</label>
                <input type="text" name="rg" value={formData.rg} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data de nascimento</label>
                <input type="text" name="dataNascimento" value={formData.dataNascimento} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" placeholder="DD/MM/AAAA" maxLength={10} required />
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
                <input type="text" name="cep" value={formData.cep} onChange={handleInputChange} onBlur={(e) => handleCepBlur(e, false)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" placeholder="00000-000" required />
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do parente próximo</label>
                <input type="text" name="parenteNome" value={formData.parenteNome} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone do parente</label>
                <input type="tel" name="parenteTelefone" value={formData.parenteTelefone} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
              <div className="md:col-span-1 relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">CEP do parente</label>
                <input type="text" name="parenteCep" value={formData.parenteCep} onChange={handleInputChange} onBlur={(e) => handleCepBlur(e, true)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" placeholder="00000-000" required />
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
                <input type="text" name="parenteEndereco" value={formData.parenteEndereco} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                <input type="text" name="parenteNumero" value={formData.parenteNumero} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Complemento</label>
                <input type="text" name="parenteComplemento" value={formData.parenteComplemento} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                <input type="text" name="parenteBairro" value={formData.parenteBairro} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                <input type="text" name="parenteCidade" value={formData.parenteCidade} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                <input type="text" name="parenteEstado" value={formData.parenteEstado} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Qual a sua atividade financeira?</label>
                <input type="text" name="atividadeFinanceira" value={formData.atividadeFinanceira} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
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
            </div>
          </section>

          {/* Documentos */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b pb-2">
              <Camera className="text-yellow-500" size={24} />
              <h2 className="text-xl font-semibold text-slate-800">Anexo de Documentos</h2>
            </div>
            
            <div className="bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-xl p-8 text-center hover:bg-yellow-100 transition-colors cursor-pointer relative">
              <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
              <div className="flex flex-col items-center justify-center space-y-3">
                <UploadCloud className="text-yellow-500" size={48} />
                <div className="text-slate-700 font-medium">Clique para fazer upload ou arraste os arquivos (máx. 10)</div>
                <div className="text-sm text-slate-500 max-w-md mx-auto">
                  "Foto do RG e/ou CNH, comprovante de residência, uma selfie com o documento ao lado do rosto. Você pode anexar até 10 arquivos."
                </div>
                {formData.documentos && formData.documentos.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full text-sm font-medium">
                    <CheckCircle2 size={16} />
                    {formData.documentos.length} arquivo(s) selecionado(s)
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="pt-6 border-t">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 text-lg ${isSubmitting ? 'bg-slate-400 cursor-not-allowed text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Enviando...
                </>
              ) : (
                'Concluir Cadastro'
              )}
            </button>
          </div>
        </form>
      </div>
      {renderModals()}
    </div>
  );
}
