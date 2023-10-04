const express = require('express');
const fs = require('fs');
const app = express();
const port = process.env.PORT;
const cors = require('cors');
const bcrypt = require('bcrypt'); // Add bcrypt for password hashing
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const secretKey = uuidv4();
const jwt = require('jsonwebtoken'); // Import the jsonwebtoken library

app.use(express.json());
const corsOptions = {
    origin: '*',
    // Additional CORS options can be specified here
};

app.use(cors(corsOptions));
const dataFilePath1 = 'transactions.json';
const dataFilePath2 = 'GRUHASANA_PUJA.json';
app.use(
    session({
        secret: 'kss@binakarojha@98610', // Replace with your own secret key
        resave: false,
        saveUninitialized: true,
    })
);
// Define a function to load data from the JSON file
function loadData() {
    try {
        const data = fs.readFileSync(dataFilePath1, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading data from file:', err);
        return [];
    }
}

// Define a function to save data to the JSON file
function saveData(data) {
    try {
        const jsonData = JSON.stringify(data, null, 2);
        fs.writeFileSync(dataFilePath1, jsonData, 'utf8');
    } catch (err) {
        console.error('Error writing data to file:', err);
    }
}

// API endpoints

// Get all bhaktas
app.get('/api/bhaktas', (req, res) => {
    const bhaktas = loadData();
    res.json(bhaktas);
});

// Add a new bhakta
app.post('/api/bhaktas', (req, res) => {
    const bhaktas = loadData();
    const newBhakta = req.body;

    // Fetch existing UniqueIds from the API
    const existingUniqueIds = bhaktas.map(bhakta => bhakta.UniqueId);

    // Generate a new UniqueId that is not in the list of existing ones
    let newUniqueId = generateUniqueId(existingUniqueIds);
    newBhakta.UniqueId = newUniqueId;

    bhaktas.push(newBhakta);
    saveData(bhaktas);
    res.json(newBhakta);
});

// Function to generate a unique ID
function generateUniqueId(existingUniqueIds) {
    let newUniqueId;

    do {
        // Generate a random 4-digit number
        const randomNumber = Math.floor(1000 + Math.random() * 9000);
        newUniqueId = `KSS${randomNumber}`;
    } while (existingUniqueIds.includes(newUniqueId));

    return newUniqueId;
}
// Update Bhakta by UniqueId
app.put('/api/bhaktas/:UniqueId', (req, res) => {
    const bhaktas = loadData();
    const updatedBhakta = req.body;
    const uniqueIdToUpdate = req.params.UniqueId;

    // Find the index of the Bhakta with the given UniqueId
    const index = bhaktas.findIndex((bhakta) => bhakta.UniqueId === uniqueIdToUpdate);

    if (index !== -1) {
        // Update the Bhakta's BhaktaId
        bhaktas[index].BhaktaId = updatedBhakta.BhaktaId;
        saveData(bhaktas);
        res.json({ message: 'Bhakta updated successfully' });
    } else {
        res.status(404).json({ message: 'Bhakta not found' });
    }
});

// Delete a Bhakta by UniqueId
app.delete('/api/bhaktas/:UniqueId', (req, res) => {
    const bhaktas = loadData();
    const index = bhaktas.findIndex((bhakta) => bhakta.UniqueId === req.params.UniqueId);
    if (index !== -1) {
        bhaktas.splice(index, 1);
        saveData(bhaktas);
        res.json({ message: 'Bhakta deleted' });
    } else {
        res.status(404).json({ message: 'Bhakta not found' });
    }
});

// Route to add a new transaction to an existing bhakta
app.post('/add-transaction', (req, res) => {
    const { BhaktaId, newTransaction } = req.body;
    // Load the transactions data from transaction.json
    const transactions = loadData();
    // Find the Bhakta by BhaktaId
    const bhakta = transactions.find((b) => b.BhaktaId === BhaktaId);
    if (!bhakta) {
        return res.status(404).json({ message: 'Bhakta not found' });
    }
    // Add the new transaction to the Bhakta's Transactions array
    bhakta.Transactions.push(newTransaction);
    // Write the updated data back to transaction.json
    saveData(transactions);
    return res.json({ message: 'Transaction added successfully' });
});


// gruhasana_puja api section

function loadGruhasanaPujaData() {
    try {
        const data = fs.readFileSync(dataFilePath2, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading data from GRUHASANA_PUJA file:', err);
        return [];
    }
}

// Define a function to save data to the GRUHASANA_PUJA JSON file
function saveGruhasanaPujaData(data) {
    try {
        const jsonData = JSON.stringify(data, null, 2);
        fs.writeFileSync(dataFilePath2, jsonData, 'utf8');
    } catch (err) {
        console.error('Error writing data to GRUHASANA_PUJA file:', err);
    }
}
// ... Your existing code ...

// Get all Gruhasana Puja programs
app.get('/api/gruhasana-puja', (req, res) => {
    const gruhasanaPujaData = loadGruhasanaPujaData();
    res.json(gruhasanaPujaData);
});

// Add a new Gruhasana Puja program
app.post('/api/gruhasana-puja', (req, res) => {
    const gruhasanaPujaData = loadGruhasanaPujaData();
    const newProgram = req.body;

    // Assign the next available ID
    const nextId = Object.keys(gruhasanaPujaData).length.toString();
    newProgram.ID = nextId;

    gruhasanaPujaData[nextId] = newProgram;
    saveGruhasanaPujaData(gruhasanaPujaData);
    res.json(newProgram);
});

// Delete a Gruhasana Puja program by ID
app.delete('/api/gruhasana-puja/:ID', (req, res) => {
    const gruhasanaPujaData = loadGruhasanaPujaData();
    const idToDelete = req.params.ID;

    if (gruhasanaPujaData.hasOwnProperty(idToDelete)) {
        delete gruhasanaPujaData[idToDelete];
        saveGruhasanaPujaData(gruhasanaPujaData);
        res.json({ message: 'Gruhasana Puja program deleted' });
    } else {
        res.status(404).json({ message: 'Gruhasana Puja program not found' });
    }
});

// Update a Gruhasana Puja program by ID
app.put('/api/gruhasana-puja/:ID', (req, res) => {
    const gruhasanaPujaData = loadGruhasanaPujaData();
    const idToUpdate = req.params.ID;
    const updatedProgram = req.body;

    if (gruhasanaPujaData.hasOwnProperty(idToUpdate)) {
        gruhasanaPujaData[idToUpdate] = updatedProgram;
        saveGruhasanaPujaData(gruhasanaPujaData);
        res.json({ message: 'Gruhasana Puja program updated' });
    } else {
        res.status(404).json({ message: 'Gruhasana Puja program not found' });
    }
});
//login api
// Read user data from the JSON file

let userData = {};

try {
    const data3 = fs.readFileSync('Admin_Login.json', 'utf8');
    userData = JSON.parse(data3);
} catch (error) {
    console.error('Error reading users.json:', error);
}

const users = userData.users;
// Login route
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Check if the provided credentials match any user
    const user = users.find((u) => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = jwt.sign({ username: user.username }, secretKey, {
        expiresIn: '1h', // Token expires in 1 hour (adjust as needed)
    });

    return res.status(200).json({ message: 'Login successful', token });
});

// Logout route
app.post('/api/logout', (req, res) => {
    const { username } = req.body;

    // Find the user in the list of logged-in users
    const index = loggedInUsers.findIndex((user) => user.username === username);

    if (index !== -1) {
        // User found, remove them from the list (logout)
        loggedInUsers.splice(index, 1);
        return res.status(200).json({ message: 'Logout successful' });
    } else {
        return res.status(401).json({ message: 'User not found or already logged out' });
    }
});






app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

