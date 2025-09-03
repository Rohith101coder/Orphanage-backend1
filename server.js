const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: "https://orphanage-frontened1.onrender.com",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// ================== Schemas ==================

// Orphanage Details Schema
const orphanageDetailsSchema = new mongoose.Schema({
    orphanageName: { type: String, required: true },
    principalName: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    address: { type: String, required: true },
    numChildren: { type: Number, required: true },
    needs: { type: String, required: true },
    latitude: { type: String, required: true },
    longitude: { type: String, required: true },
    portNumber: { type: String, required: true, unique: true }
});
const OrphanageDetails = mongoose.model('OrphanageDetails', orphanageDetailsSchema);

// Donor Schema
const donorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const Donor = mongoose.model('Donor', donorSchema);

// Orphanage Schema (for login/registration)
const orphanageSchema = new mongoose.Schema({
    headName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const Orphanage = mongoose.model('Orphanage', orphanageSchema);

// ================== Routes ==================

// Health Check
app.get('/healthz', (req, res) => res.send('OK'));

app.get("/",(req,res)=>{
    res.send("OrphanageCare backend is running!");
});

// Donor Registration
app.post('/register-donor', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingDonor = await Donor.findOne({ email });
        if (existingDonor) return res.status(400).json({ message: 'Already registered' });

        const newDonor = new Donor({ name, email, password });
        await newDonor.save();
        res.status(201).json({ message: 'Donor registration successful!' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering donor: ' + error.message });
    }
});

// Orphanage Registration
app.post('/register-orphanage', async (req, res) => {
    const { headName, email, password } = req.body;
    try {
        const existingOrphanage = await Orphanage.findOne({ email });
        if (existingOrphanage) return res.status(400).json({ message: 'Already registered' });

        const newOrphanage = new Orphanage({ headName, email, password });
        await newOrphanage.save();
        res.status(201).json({ message: 'Orphanage registration successful!' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering orphanage: ' + error.message });
    }
});

// Donor Login
app.post('/login-donor', async (req, res) => {
    const { email, password } = req.body;
    try {
        const donor = await Donor.findOne({ email });
        if (!donor) return res.status(400).json({ message: 'Donor not found' });
        if (donor.password !== password) return res.status(400).json({ message: 'Incorrect password' });

        res.status(200).json({ message: 'Login successful!' });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred: ' + error.message });
    }
});

// Orphanage Login
app.post('/login-orphanage', async (req, res) => {
    const { email, password } = req.body;
    try {
        const orphanage = await Orphanage.findOne({ email });
        if (!orphanage) return res.status(400).json({ message: 'Orphanage not found' });
        if (orphanage.password !== password) return res.status(400).json({ message: 'Incorrect password' });

        res.status(200).json({ message: 'Login successful!' });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred: ' + error.message });
    }
});

// Add Orphanage Details
app.post('/add-orphanage', async (req, res) => {
    try {
        const newOrphanageDetails = new OrphanageDetails(req.body);
        await newOrphanageDetails.save();
        res.status(201).json({ message: 'Orphanage details added successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding orphanage details: ' + error.message });
    }
});

// Check Port Number Uniqueness
app.get('/check-port-number/:portNumber', async (req, res) => {
    try {
        const existingPort = await OrphanageDetails.findOne({ portNumber: req.params.portNumber });
        res.json({ isUnique: !existingPort });
    } catch (error) {
        res.status(500).json({ message: 'Error checking port number: ' + error.message });
    }
});

// Fetch All Orphanages (summary)
app.get('/get-orphanages', async (req, res) => {
    try {
        const orphanages = await OrphanageDetails.find(
            {},
            'orphanageName principalName address numChildren needs portNumber'
        );
        res.json(orphanages);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch orphanages: ' + error.message });
    }
});

// Get Orphanage by ID
app.get('/orphanage-details/:id', async (req, res) => {
    try {
        const orphanage = await OrphanageDetails.findById(req.params.id);
        if (orphanage) res.json(orphanage);
        else res.status(404).json({ message: 'Orphanage not found' });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orphanage details' });
    }
});

// Get Orphanage by Port Number
app.get('/get-orphanage-by-port/:portNumber', async (req, res) => {
    try {
        const orphanage = await OrphanageDetails.findOne({ portNumber: req.params.portNumber });
        if (orphanage) res.json(orphanage);
        else res.status(404).json({ message: 'Orphanage not found' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update Orphanage Details by Port Number
app.post('/update-orphanage/:portNumber', async (req, res) => {
    try {
        const orphanage = await OrphanageDetails.findOneAndUpdate(
            { portNumber: req.params.portNumber },
            req.body,
            { new: true }
        );
        if (orphanage) res.json({ message: 'Orphanage updated successfully' });
        else res.status(404).json({ message: 'Orphanage not found' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update orphanage' });
    }
});

// ================== Start Server ==================
app.listen(PORT, "0.0.0.0",() => {
    console.log(`Server is running on port ${PORT}`);
});

//rohithvadla07_db_user


//PHvwYC93hLQhjJL3

