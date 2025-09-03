import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  Alert,
  TextInput,
  ScrollView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import * as SQLite from 'expo-sqlite';

export default function App() {
  const [db, setDb] = useState(null);
  const [mensagem, setMensagem] = useState('Inicializando...');
  const [aba, setAba] = useState('status'); // 'status', 'inserir', 'consulta'

  // Estados para inserção
  const [nome, setNome] = useState('');
  const [salario, setSalario] = useState('');
  const [cargo, setCargo] = useState('');

  // Estados para consulta
  const [searchText, setSearchText] = useState('');
  const [salarioMinimo, setSalarioMinimo] = useState('');
  const [results, setResults] = useState([]);
  const [statusConsulta, setStatusConsulta] = useState('Inicializando...');

  // Inicializar banco e criar tabela
  useEffect(() => {
    async function setupDatabase() {
      try {
        const database = await SQLite.openDatabaseAsync('meu_banco.db');
        setDb(database);
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS funcionarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            salario REAL NOT NULL,
            cargo TEXT NOT NULL
          );
        `);
        setMensagem('✅ Banco de dados e tabela prontos!');
        setStatusConsulta('✅ Banco de dados e tabela prontos!');
      } catch (error) {
        console.error('Erro ao conectar ou criar tabela:', error);
        setMensagem('❌ Erro ao inicializar o banco de dados. Veja o log.');
        setStatusConsulta('❌ Erro ao inicializar o banco de dados.');
        Alert.alert('Erro', 'Não foi possível conectar ao banco de dados.');
      }
    }
    setupDatabase();
  }, []);




 
  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}><Text style={{fontWeight:'700'}}>ID:</Text> {item.id}</Text>
      <Text style={styles.itemText}><Text style={{fontWeight:'700'}}>Nome:</Text> {item.nome}</Text>
      <Text style={styles.itemText}><Text style={{fontWeight:'700'}}>Salário:</Text> R$ {item.salario.toFixed(2)}</Text>
      <Text style={styles.itemText}><Text style={{fontWeight:'700'}}>Cargo:</Text> {item.cargo}</Text>
    </View>
  );

  // -------------------------------------- CRIAR

  // Criar tabela manualmente (botão)
  const criarTabela = async () => {
    if (!db) {
      setMensagem('❌ Banco de dados não está pronto.');
      Alert.alert('Erro', 'Banco de dados não foi inicializado.');
      return;
    }
    try {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS funcionarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          salario REAL NOT NULL,
          cargo TEXT NOT NULL
        );
      `);
      setMensagem('✅ Tabela "funcionarios" criada com sucesso!');
      Alert.alert('Sucesso', 'Tabela "funcionarios" criada!');
    } catch (error) {
      console.error('Erro ao criar tabela:', error);
      setMensagem('❌ Erro ao criar a tabela. Veja o log.');
      Alert.alert('Erro', 'Falha ao criar a tabela.');
    }
  };

  const renderAbaStatus = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Status do Banco de Dados</Text>
      <Text style={styles.statusText}>{mensagem}</Text>
      <Button title="Criar Tabela (se não existir)" onPress={criarTabela} disabled={!db} color="#4A90E2" />
    </View>
  );
// ------------------------------------------- ADCIONAR 

  // Inserir funcionário
  const adicionarFuncionario = async () => {
    if (!nome.trim() || !salario.trim() || !cargo.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
    if (!db) {
      Alert.alert('Erro', 'Banco de dados não está pronto.');
      return;
    }
    try {
      await db.runAsync(
        'INSERT INTO funcionarios (nome, salario, cargo) values (?, ?, ?);',
        [nome.trim(), parseFloat(salario), cargo.trim()]
      );
      Alert.alert('Sucesso', 'Funcionário adicionado com sucesso!');
      setNome('');
      setSalario('');
      setCargo('');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao adicionar funcionário.');
      console.error('Erro ao inserir:', error);
    }
  };


  const renderAbaInserir = () => (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Adicionar Novo Funcionário</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome do Funcionário"
        value={nome}
        onChangeText={setNome}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Salário"
        keyboardType="numeric"
        value={salario}
        onChangeText={setSalario}
      />
      <TextInput
        style={styles.input}
        placeholder="Cargo"
        value={cargo}
        onChangeText={setCargo}
        autoCapitalize="words"
      />
      <Button title="Adicionar Funcionário" onPress={adicionarFuncionario} color="#4A90E2" />
    </ScrollView>
  );
// -------------------------------------------------- CONSULTA

 // Consulta genérica
  const executarConsulta = async (query, params = []) => {
    if (!db) {
      Alert.alert('Erro', 'O banco de dados não está pronto.');
      return;
    }
    try {
      const rows = await db.getAllAsync(query, params);
      setResults(rows);
      if (rows.length === 0) {
        Alert.alert('Aviso', 'Nenhum resultado encontrado.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na consulta. Veja o console.');
      console.error('Erro na consulta:', error);
    }
  };

  const exibirTodos = async () => {
    await executarConsulta('SELECT * FROM funcionarios;');
  };

  const pesquisarNome = async () => {
    if (!searchText.trim()) {
      Alert.alert('Aviso', 'Digite um nome para pesquisar.');
      return;
    }
    await executarConsulta('SELECT * FROM funcionarios WHERE nome LIKE ?;', [
      `%${searchText}%`,
    ]);
  };

  const pesquisarSalario = async () => {
    const minSalario = parseFloat(salarioMinimo);
    if (isNaN(minSalario)) {
      Alert.alert('Aviso', 'Digite um número válido para o salário.');
      return;
    }
    await executarConsulta('SELECT * FROM funcionarios WHERE salario >= ?;', [
      minSalario,
    ]);
  };

  const pesquisarCargo = async () => {
    if (!searchText.trim()) {
      Alert.alert('Aviso', 'Digite um cargo para pesquisar.');
      return;
    }
    await executarConsulta('SELECT * FROM funcionarios WHERE cargo LIKE ?;', [
      `%${searchText}%`,
    ]);
  };


  const renderAbaConsulta = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Consultar Funcionários</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nome ou Cargo"
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="Salário Mínimo"
          keyboardType="numeric"
          value={salarioMinimo}
          onChangeText={setSalarioMinimo}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Exibir Todos" onPress={exibirTodos} disabled={!db} color="#4A90E2" />
        <View style={{ height: 10 }} />
        <Button title="Pesquisar Nome" onPress={pesquisarNome} disabled={!db} color="#4A90E2" />
        <View style={{ height: 10 }} />
        <Button title="Salários Acima de" onPress={pesquisarSalario} disabled={!db} color="#4A90E2" />
        <View style={{ height: 10 }} />
        <Button title="Pesquisar Cargo" onPress={pesquisarCargo} disabled={!db} color="#4A90E2" />
      </View>

      <FlatList
        style={styles.list}
        data={results}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={{textAlign:'center', color:'#888'}}>Nenhum resultado</Text>}
      />
    </View>
  );

  return (
    <>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setAba('status')} style={[styles.navButton, aba === 'status' && styles.navButtonActive]}>
          <Text style={styles.navText}>Status</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setAba('inserir')} style={[styles.navButton, aba === 'inserir' && styles.navButtonActive]}>
          <Text style={styles.navText}>Inserir</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setAba('consulta')} style={[styles.navButton, aba === 'consulta' && styles.navButtonActive]}>
          <Text style={styles.navText}>Consulta</Text>
        </TouchableOpacity>
      </View>

      {aba === 'status' && renderAbaStatus()}
      {aba === 'inserir' && renderAbaInserir()}
      {aba === 'consulta' && renderAbaConsulta()}
    </>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  navButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 25,
  },
  navButtonActive: {
    backgroundColor: '#357ABD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  navText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
    backgroundColor: '#F0F4F8',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
    fontFamily: 'System',
  },
  statusText: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderColor: '#D1D9E6',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'white',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonContainer: {
    flexDirection: 'column',
    marginBottom: 24,
  },
  list: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  item: {
    padding: 20,
    borderBottomColor: '#E6EAF0',
    borderBottomWidth: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  searchContainer: {
    flexDirection: 'column',
    marginBottom: 20,
  },
});
