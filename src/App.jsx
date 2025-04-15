import { useState, useEffect, useCallback } from 'react';
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
import Box from '@mui/material/Box';
ModuleRegistry.registerModules([AllCommunityModule]);
const FIREBASE_URL = import.meta.env.VITE_FIREBASE_DB_URL;

function App() {
  const [books, setBooks] = useState([]);
  const [gridApi, setGridApi] = useState(null);
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

  const fetchItems = useCallback(() => {
    console.log("Fetching items...");
    fetch(`${FIREBASE_URL}/books/.json`)
        .then(response => response.json())
        .then(data => addKeys(data))
        .catch(err => console.error('Failed to fetch books:', err));
  }, []);

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
    if (data) { 
      const keys = Object.keys(data);
      const valueKeys = Object.values(data).map((book, index) =>
      Object.defineProperty(book, 'id', { value: keys[index] }));
      setBooks(valueKeys);
    } else {
      setBooks([]); 
    }
  }

  const onGridReady = useCallback((params) => {
    console.log("Grid Ready, API stored.");
    setGridApi(params.api);
  }, []);

  const deleteBook = useCallback((id) => {
    if (!gridApi) {
         console.error("Delete clicked, but Grid API not available yet.");
         return; 
     }
     console.log(`Attempting to delete book with id: ${id}`);

    const rowNode = gridApi.getRowNode(id);

    if (!rowNode) {
        console.warn(`Row node with id ${id} not found in grid. Forcing full refresh.`);
         fetchItems(); 
        return;
    }

    const rowDataToDelete = rowNode.data;
    console.log("Found row data to delete:", rowDataToDelete);

    fetch(`${FIREBASE_URL}/books/${id}.json`, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            console.error(`Firebase delete failed for book ${id}. Status: ${response.status}`);
            throw new Error(`Firebase delete failed with status ${response.status}`);
        }
         console.log(`Successfully deleted book ${id} from Firebase. Applying transaction to grid.`);

        gridApi.applyTransactionAsync({ remove: [rowDataToDelete] });
    })
    .catch(err => {
        console.error(`Error during Firebase delete operation for book ${id}:`, err);
    });
  }, [gridApi, fetchItems]);

  const contentWrapperStyle = {
    width: '100%',       
    maxWidth: '1090px',  
    margin: '0 auto'     
  };

  const gridContainerStyle = {
    ...contentWrapperStyle, 
    height: 400,
    marginTop: '20px',
    marginBottom: '20px'
  };

  const getRowId = useCallback(params => {
    if (!params.data || typeof params.data.id === 'undefined') {
         console.error("Missing 'id' in row data:", params.data);
         return undefined; 
     }
     return params.data.id;
  }, []);

  return (
    <div className="App">
        <AppBar position="static">
            <Box sx={contentWrapperStyle}>
                <Toolbar disableGutters>
                    <Typography variant="h5" component="div" sx={{ flexGrow: 1, pl: 2 }}>
                        Booklist
                    </Typography>
                </Toolbar>
            </Box>
        </AppBar>
        <Box sx={{...contentWrapperStyle, mt: 2 }}>
             <AddBook addBook={addBook} />
        </Box>

        <div
            className="ag-theme-material"
            style={gridContainerStyle}
        >
            <AgGridReact
                theme='legacy'
                rowData={books}
                columnDefs={columnDefs}
                pagination={true}
                paginationPageSize={20}
                getRowId={getRowId}
                onGridReady={onGridReady}
                animateRows={true}
            />
        </div>
    </div>
  );
}

export default App;