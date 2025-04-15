import { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import './App.css';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import AddBook from './AddBook';
ModuleRegistry.registerModules([AllCommunityModule]);
const FIREBASE_URL = import.meta.env.VITE_FIREBASE_DB_URL;

function App() {
  const [books, setBooks] = useState([]);

  const columnDefs = [
    { field: 'title', sortable: true, filter: true},
    { field: 'author', sortable: true, filter: true},
    { field: 'year', sortable: true, filter: true},
    { field: 'isbn', sortable: true, filter: true},
    { field: 'price', sortable: true, filter: true},
    { 
      headerName: '',
      field: 'id',
      width: 90,
      cellRenderer: params => 
      <IconButton onClick={() => deleteBook(params.value)} size="small" color="error">
        <DeleteIcon />
      </IconButton> 
    }
  ]
 
  useEffect(() => {
    fetchItems();
  }, [])

  const fetchItems = () => {
    fetch(`${FIREBASE_URL}/books/.json`)
    .then(response => response.json())
    .then(data => addKeys(data))
    .catch(err => console.error(err))
  };

  const addBook = (newBook) => {
    fetch(`${FIREBASE_URL}/books/.json`,
    {
      method: 'POST',
      body: JSON.stringify(newBook)
    })
    .then(response => fetchItems())
    .catch(err => console.error(err))
  }

  const addKeys = (data) => {
    if (data) { // Check if data is not null/undefined
      const keys = Object.keys(data);
      const valueKeys = Object.values(data).map((book, index) =>
      Object.defineProperty(book, 'id', { value: keys[index] }));
      setBooks(valueKeys);
    } else {
      setBooks([]); // Set to empty array if no data
    }
  }

  const deleteBook = (id) => {
    fetch(`${FIREBASE_URL}/books/${id}.json`,
    {
      method: 'DELETE',
    })
    .then(response => fetchItems())
    .catch(err => console.error(err))
  }

  return (
    <div className="App"> 
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h5">
            Booklist
          </Typography>
        </Toolbar>
      </AppBar>
      <AddBook addBook={addBook} /> 
      <div className="ag-theme-material" style={{ height: 400, width: 1090 }}>
        <AgGridReact
          theme='legacy'
          rowData={books}
          columnDefs={columnDefs}
          pagination={true}
          paginationPageSize={20}
        />
      </div>
    </div>
  );
}

export default App;