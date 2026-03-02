import React, { useState } from 'react';
import { User, MapPin, FileText, Users, Camera, UploadCloud, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [formData, setFormData] = useState({
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
    documentos: null as FileList | null
  });

  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingParenteCep, setLoadingParenteCep] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({ ...prev, documentos: e.target.files }));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Dados do formulário:', formData);
    alert('Cadastro realizado com sucesso!');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
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
                <input type="text" name="cpf" value={formData.cpf} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">RG</label>
                <input type="text" name="rg" value={formData.rg} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data de nascimento</label>
                <input type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" required />
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Quem te indicou?</label>
                <input type="text" name="quemIndicou" value={formData.quemIndicou} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Redes sociais (Instagram, Facebook, etc)</label>
                <input type="text" name="redesSociais" value={formData.redesSociais} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all" placeholder="@seuperfil" />
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
                <div className="text-slate-700 font-medium">Clique para fazer upload ou arraste os arquivos</div>
                <div className="text-sm text-slate-500 max-w-md mx-auto">
                  "Foto do RG e/ou CNH, comprovante de residência, uma selfie com o documento ao lado do rosto."
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
            <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 text-lg">
              Concluir Cadastro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
