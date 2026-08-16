const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Deal = require('./models/Deal');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/enterprise_crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected')).catch(err => console.log(err));

// REST API: Get all deals
app.get('/api/deals', async (req, res) => {
  try {
    const deals = await Deal.find().sort({ createdAt: -1 });
    res.json({ success: true, data: deals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// REST API: Create a new deal
app.post('/api/deals', async (req, res) => {
  try {
    const newDeal = await Deal.create(req.body);
    res.status(201).json({ success: true, data: newDeal });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// REST API: Update deal (Stage or Details)
app.put('/api/deals/:id', async (req, res) => {
  try {
    const updatedDeal = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedDeal) return res.status(404).json({ success: false, message: 'Deal not found' });
    res.json({ success: true, data: updatedDeal });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// REST API: Delete deal
app.delete('/api/deals/:id', async (req, res) => {
  try {
    const deletedDeal = await Deal.findByIdAndDelete(req.params.id);
    if (!deletedDeal) return res.status(404).json({ success: false, message: 'Deal not found' });
    res.json({ success: true, message: 'Deal deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));