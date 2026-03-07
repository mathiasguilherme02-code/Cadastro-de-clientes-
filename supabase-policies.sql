-- Habilitar Row Level Security (RLS) nas tabelas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (caso existam) para evitar conflitos
DROP POLICY IF EXISTS "Allow public read access on clients" ON clients;
DROP POLICY IF EXISTS "Allow public insert access on clients" ON clients;
DROP POLICY IF EXISTS "Allow public update access on clients" ON clients;
DROP POLICY IF EXISTS "Allow public delete access on clients" ON clients;

DROP POLICY IF EXISTS "Allow public read access on admin_settings" ON admin_settings;
DROP POLICY IF EXISTS "Allow public insert access on admin_settings" ON admin_settings;
DROP POLICY IF EXISTS "Allow public update access on admin_settings" ON admin_settings;

-- Criar políticas para a tabela 'clients'
-- Permite que o servidor (usando a chave anon) leia os clientes (para login via CPF e listagem do admin)
CREATE POLICY "Allow public read access on clients" ON clients FOR SELECT USING (true);

-- Permite que o servidor insira novos clientes (para cadastro)
CREATE POLICY "Allow public insert access on clients" ON clients FOR INSERT WITH CHECK (true);

-- Permite que o servidor atualize clientes (para quando o cliente ou admin atualizar os dados)
CREATE POLICY "Allow public update access on clients" ON clients FOR UPDATE USING (true);

-- Permite que o servidor delete clientes (para o admin)
CREATE POLICY "Allow public delete access on clients" ON clients FOR DELETE USING (true);

-- Criar políticas para a tabela 'admin_settings'
-- Permite leitura das configurações (taxas de juros, etc)
CREATE POLICY "Allow public read access on admin_settings" ON admin_settings FOR SELECT USING (true);

-- Permite inserção das configurações (caso não existam)
CREATE POLICY "Allow public insert access on admin_settings" ON admin_settings FOR INSERT WITH CHECK (true);

-- Permite atualização das configurações (pelo admin)
CREATE POLICY "Allow public update access on admin_settings" ON admin_settings FOR UPDATE USING (true);
